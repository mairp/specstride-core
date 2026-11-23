# Verification record: feature 111 (Event schema)

This is the verification record of feature 111, written for task **T075** (which
covers **F111-FR-018** and **F111-FR-035**).

T075 reads: *Run the tests of the feature on the macOS runner when it exists and
record the result; until then every macOS statement stays `unverified`; a test
whose prerequisite is missing (the fixtures of the oracle, a macOS runner, a
collector) reports a skip with its reason.*

The **macOS runner part is out of band** (the owner's ruling of 2026-09-30): it
is never run here and never faked. No macOS runner exists in this checkout, so
every macOS statement of this feature stays `unverified`, with its reason, in
the table below. The hermetic part — running the tests of the feature on Linux
and making every missing prerequisite report a skip with its reason — is done,
and the result is below.

Nothing in this record is remembered. `tests/release/111/verification.ts` runs
the suites again on every `npm test`, and
`tests/release/111/verification-record.test.ts` holds the three tables below
against that fresh run. A record that no longer reproduces fails the build.

- Runner: `tests/release/111/verification.ts`
- Test that runs it and holds this record to it: `tests/release/111/verification-record.test.ts`
- The tests that report a missing prerequisite: `tests/release/111/prerequisites.test.ts`

## The run

Run on 2026-10-01; refreshed on 2026-11-07. The counts rose from 433/424 to
442/433 in phase 8, by exactly the nine tests T076 adds to
`packages/observability/test/data-consistency.test.ts`. The refresh of
2026-11-07 raised them from 442/433 to 448/439, by exactly the six tests the
kernel fix of 2026-11-04 adds in
`packages/kernel/test/redactor/url-embedded-credentials.test.ts`
(url-embedded-credentials no longer reads markup as user-info): the ruling's
addresses are hits, the ruling's false positive is not a hit in either writing
of its newline, a commit file holding only the false positive is not blocked,
one file with the false positive and one with a real hit names only the real
one, each character the ruling excludes breaks the match where it once matched,
and the narrowed set loads with its version as the digest of its content
(F111-FR-029). The nine skips are unchanged, row for row. The refreshed run is
`linux` / node `v22`, exit 0, and the same totals with the same test-name list
reproduce on the checkout this repository was cloned from.

<!-- verification-run:begin -->

| Field | Value |
|---|---|
| platform | linux |
| node | v22 |
| exit | 0 |
| tests | 448 |
| pass | 439 |
| fail | 0 |
| skipped | 9 |

<!-- verification-run:end -->

The suites run are the six of `FEATURE_SUITES` in
`tests/release/111/verification.ts`: `packages/observability/test`,
`packages/kernel/test/redactor`, `packages/testkit/src/conformance/EP-08`,
`tests/parity/111`, `tests/security/111` and
`tests/release/111/prerequisites.test.ts`.

## macOS statements — all `unverified`

Every statement of this feature about macOS, with the status it has and the
reason it has it. The column `Source` names the file the statement is written
in, and `Phrase` is the text that is checked to be there, so a row cannot
quietly stop being a statement of this feature.

<!-- macos-statements:begin -->

| Statement | Requirement | Status | Reason | Source | Phrase |
|---|---|---|---|---|---|
| The behaviour of the append and of a torn line on macOS | F111-FR-018 | unverified | No macOS runner exists in this checkout. The check is the parity oracle and the conformance suite on a macOS runner; running one is out of band and is never faked here. The Linux behaviour is tested by CT-111-118 in `packages/observability/test/seq.test.ts`. | specs/111-event-schema-and-projection/research.md | Behaviour of the append and of a torn line on macOS |
| The append and the lock behave the same on Linux and on macOS | F111-FR-018 | unverified | The same reason: no macOS runner, so the parity of the two platforms is asserted by the plan and observed on neither side but Linux. | specs/111-event-schema-and-projection/plan.md | The append and the lock are the same on both |
| Whether a collector honours the time limit of a sink call | F111-FR-035 | unverified | No real collector is reachable from this checkout and none is named in `SPECSTRIDE_COLLECTOR_URL`. The dead-collector FIXTURE runs and passes (CT-111-135, CT-111-136); a real collector on both platforms is what would settle it. | specs/111-event-schema-and-projection/research.md | Whether a collector honours the time limit of a sink call |
| Every statement about macOS of this feature | ruling 67 | unverified | The owner's constraint: Linux and macOS are both first-class, and every statement about macOS is `unverified` until a macOS runner records otherwise. | specs/111-event-schema-and-projection/plan.md | every macOS statement is `unverified` (ruling 67) |

<!-- macos-statements:end -->

## Skips — every one with its reason

Nine tests of this feature report a skip. Each names the prerequisite it lacks,
in its own reason string, and none is counted as a pass.

<!-- skips:begin -->

| Prerequisite | Skips |
|---|---|
| the fixtures of the oracle | 5 |
| a macOS runner | 2 |
| a collector | 1 |
| the compatibility projection (feature 144) | 1 |

<!-- skips:end -->

The three prerequisites T075 names are the first three. The fourth is the
compatibility projection, which feature 144 owns and which is not built; it is
recorded here rather than left out, because an unclassified skip is exactly what
this record exists to prevent — `prerequisiteOf` in the runner returns
`unclassified` for a reason that names no prerequisite, and the test fails on
one.

The nine, by name:

- `PT-111-C-167: the redaction of the reference on FX-01 and FX-26 equals the port's` — the fixtures of the oracle
- `PT-111-C-167: the targets of the reference on FX-26 equal the port's` — the fixtures of the oracle
- `PT-111-C-167: the limits of the reference on FX-26 equal the port's` — the fixtures of the oracle
- `PT-111-C-167: the retention of the reference on FX-01 equals the port's` — the fixtures of the oracle
- `CT-111-129: on the materialized fixtures of the oracle, no text matches a widened-only pattern` — the fixtures of the oracle
- `T075 (F111-FR-018): the append and the torn line on macOS` — a macOS runner
- `T075 (F111-FR-035): the time limit of a sink call on macOS` — a macOS runner
- `T075 (F111-FR-035): a real collector honours the time limit of a sink call` — a collector
- `CT-111-133: the projection files hold no canary` — the compatibility projection (feature 144)

## What is honestly not claimed

- **No test ran on macOS.** The record says `linux` because that is the platform
  the runner observed through `process.platform`. When a macOS runner exists,
  T075's remaining half is to run the same suites there and add a second run
  table; until then the four statements above stay `unverified`.
- **The two macOS tests of `prerequisites.test.ts` are skips, not passes.** On a
  macOS runner they run; here they report the missing runner as their reason.
  Their hermetic counterparts — CT-111-118 for the append and the torn line,
  CT-111-135 and CT-111-136 for the time limit of a sink call — run on this
  platform and pass, and `prerequisites.test.ts` asserts without skipping that
  both are in the build, so a skip here can never be read as "the requirement is
  untested".
- **The five oracle skips are feature 141's prerequisite, not a gap of this
  feature.** The port halves of the four parity tests run in full; only the
  comparison against the reference needs `packages/oracle` and
  `tests/parity/reference`, which feature 141 has not built. The DECLARED
  fixture texts of FX-01 and FX-26 are scanned and do not skip (phase 5,
  attempt 2).
