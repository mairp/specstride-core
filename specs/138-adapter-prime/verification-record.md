# Verification record of feature 138 (T061)

**Written**: 2026-10-27, phase 9. **Held to account by**: `tests/characterization/138/facts.test.ts` (T060),
which re-parses the `status:` lines of `specs/138-adapter-prime/spec.md` on every build and fails
when a fact loses its row here, when a row claims a capture result nobody took, or when a "waiting"
row quietly becomes a claim.

## The rule of this record

The five captures of `contracts/capture-plan.json` and the two live probes run ONLY by the owner's
explicit authorization (T001; the owner ruling of 2026-09-30 puts them out of band). **They have not run.** No capture output exists, no capture fixture was created, and nothing here is faked: every
fact of `spec.md` that waits for a capture is listed in section B as `waiting`, with its reason.
The hermetic part of T061 is this record itself: the verified facts of section A keep their
`verified-on` date, pin and the source each was read from, and section C keeps the empty fixture
slots the capture run will fill. No executable of the prime agent is started by this feature.

## A. Verified facts (fixture of record: the readings below)

| Requirement | Verified on | Pin | Fact, as `spec.md` states it | Read from |
|---|---|---|---|---|
| F138-FR-002 | 2026-09-29 | prime-agent 0.7.3 | verified-on 2026-09-29 for the presence check and the version flag of the installed agent executable (R9 Q1); pin: prime-agent 0.7.3. | R9 |
| F138-FR-015 | 2026-09-29 | prime-agent 0.7.3 | verified-on 2026-09-29 for the harness's own statement in its help text (R9 F19); pin: prime-agent 0.7.3. | R9 |
| F138-FR-020 | 2026-09-30 | prime-agent 0.7.3 | verified-on 2026-09-30 for the existence of the flags for extensions and prompt templates in the help of the installed agent executable; pin: prime-agent 0.7.3. | the help of the installed agent executable |
| F138-FR-038 | 2026-09-29 | prime-agent 0.7.3 | verified-on 2026-09-29 for exit 0 on a provider error (R9 F5, from the code and the recorded streams of the baseline); pin: prime-agent 0.7.3. | R9 |
| F138-FR-041 | 2026-09-29 | prime-agent 0.7.3 | verified-on 2026-09-29 for the existence of both switches in the documentation shipped with the installed version (R9 F17); pin: prime-agent 0.7.3. | R9 |
| F138-FR-044 | 2026-09-30 | prime-agent 0.7.3 | verified-on 2026-09-30 for the existence of the four switches in the help of the installed agent executable; pin: prime-agent 0.7.3. | the help of the installed agent executable |

## B. Waiting for a capture (never run here, never faked)

| Requirement | Fact, as `spec.md` states it | Waits for |
|---|---|---|
| F138-FR-002 | The stream at the pin: unverified (check: the capture (1) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (1) of F138-FR-042 |
| F138-FR-004 | unverified (check: the licence of the harness and the terms of the upstream model endpoints, which R8 F-D4 could not establish; verified-on: —; pin: —) | no capture of the plan covers it (out of band; see the check text) |
| F138-FR-007 | unverified (check: a fleet note of 2026-08-19 reports it (R9 F20); it is not reproduced, no model call was made; verified-on: —; pin: —) | no capture of the plan covers it (out of band; see the check text) |
| F138-FR-014 | unverified (check: the resume flag inside a session directory works in print mode at the pin; capture (4) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (4) of F138-FR-042 |
| F138-FR-015 | Whether prime's file tools are confined by anything: unverified (check: capture of a pass with a planted write outside the working directory; verified-on: —; pin: prime-agent 0.7.3) | no capture of the plan covers it (out of band; see the check text) |
| F138-FR-016 | unverified (check: the allow-list flag and the names of the tools at the pin; verified-on: —; pin: prime-agent 0.7.3) | no capture of the plan covers it (out of band; see the check text) |
| F138-FR-020 | That the critic in JSON mode at the pin ends with a terminal record: unverified (check: capture (1) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (1) of F138-FR-042 |
| F138-FR-021 | unverified (check: whether the initial record states the tool list; capture (3) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (3) of F138-FR-042 |
| F138-FR-022 | unverified (check: the model list of the harness at the pin states a context window per model; verified-on: —; pin: prime-agent 0.7.3) | no capture of the plan covers it (out of band; see the check text) |
| F138-FR-026 | unverified (check: the recorded stream of a pass at the pin holds no record type outside this set; capture (1) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (1) of F138-FR-042 |
| F138-FR-035 | unverified (check: the recorded stream at the pin reports cost, and in which unit; capture (1) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (1) of F138-FR-042 |
| F138-FR-038 | The record and the exit code when a provider limit is reached: unverified (check: capture (2) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (2) of F138-FR-042 |
| F138-FR-039 | unverified (check: the text of a provider limit at the pin, captured; capture (2) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (2) of F138-FR-042 |
| F138-FR-041 | That the switches suppress every call the harness makes to the network: unverified (check: a pass under a network that records connections; verified-on: —; pin: prime-agent 0.7.3) | no capture of the plan covers it (out of band; see the check text) |
| F138-FR-042 | unverified (check: the five captures; verified-on: —; pin: prime-agent 0.7.3) | the five captures of F138-FR-042 |
| F138-FR-044 | That a call with the four switches loads none of the four kinds: unverified (check: capture (5) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (5) of F138-FR-042 |
| F138-FR-045 | unverified (check: the agent executable takes its configuration directory from the home variable, and a call at auth tier 1 with sessions off writes nothing to the home; capture (5) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (5) of F138-FR-042 |
| F138-FR-046 | unverified (check: the pinned version holds no memory beyond saved sessions, the goal of a session and context files; read from the documentation shipped with the pin and from capture (5) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3) | capture (5) of F138-FR-042 |

## C. The capture fixtures (slots, deliberately empty)

| Capture | Fixture slot of `capture-plan.json` | State |
|---|---|---|
| 1 | `tests/fixtures/streams/capture-1-*` | absent — created only by the owner-authorized capture run, each with its `verified-on` date and the version |
| 2 | `tests/fixtures/streams/capture-2-*` | absent — created only by the owner-authorized capture run, each with its `verified-on` date and the version |
| 3 | `tests/fixtures/streams/capture-3-*` | absent — created only by the owner-authorized capture run, each with its `verified-on` date and the version |
| 4 | `tests/fixtures/streams/capture-4-*` | absent — created only by the owner-authorized capture run, each with its `verified-on` date and the version |
| 5 | `tests/fixtures/streams/capture-5-*` | absent — created only by the owner-authorized capture run, each with its `verified-on` date and the version |

Until a capture result exists, every `status` field of `spec.md` that names it stays open. Closing
one is the owner's act, on the owner's captured output — never this feature's.

## D. The macOS runner (T072, owner ruling of 2026-09-30 — out of band, never faked)

**Status: `unverified`.** No macOS runner exists in this workdir, so the feature's tests were
NOT run on macOS and no macOS result is claimed or fabricated. The hermetic part of T072 was
done on Linux: the full root gate (`npm run test`), the characterization suites and the static
testkit scope all pass on Linux (see
`.specstride/features/138-adapter-prime/gates/GATE10-EVIDENCE.md` for the run logs). The macOS
part stays `unverified` with this reason: **the runner does not exist here**; when it exists,
run `npm run test` on it and record the result in this section with its date. Until then every
macOS statement of the feature remains `unverified`.

A test whose prerequisite is missing reports a SKIP with its reason, never a pass:
`tests/characterization/138/home.test.ts` carries `CT-138-45 [skip]` — "no macOS runner exists
in this workdir" — and the capture-dependent facts stay in section B above.
