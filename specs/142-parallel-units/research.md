# Research: Parallel units (feature 142)

Phase 0 of the plan. The research itself stays in `docs/ecosystem/`. This file records the
decisions of the plan and links to the reports. No unknown of the Technical Context is left open.

| Report | Used for |
|---|---|
| [R29](../../docs/ecosystem/research/R29-parallel-units-design.md) | The design, rules PU-01 to PU-78; the probe F-6; the ceiling F-2; experiment E6 |
| [R29v](../../docs/ecosystem/research/R29v-parallel-units-red-team.md) | Rules PU-79 to PU-104, which stand over R29; items O-1 to O-8, closed by rulings P1 to P10 |
| [R26](../../docs/ecosystem/research/R26-parallel-execution.md) | The measured ceiling of parallel work |
| [R27](../../docs/ecosystem/research/R27-run-acceleration-synthesis.md), [R23](../../docs/ecosystem/research/R23-inner-checks-gate-integrity.md), [R23v](../../docs/ecosystem/research/R23v-gate-red-team.md) | The micro-loop layer and the integrity rules IR-01 to IR-60 |
| [R11](../../docs/ecosystem/research/R11-security-threat-model.md) | Controls R-1 and R-2; threats T-19 to T-29 |
| [R14](../../docs/ecosystem/research/R14-quotas-cost-observability.md), [R24](../../docs/ecosystem/research/R24-warm-start-context-carry-over.md) | Quota signals; the drop rules of session continuation |

## D-1 to D-5

The decisions on composition, the form of a worker tree, the git floor, the application and the
place of the engine services left this feature at the split. Their numbers are not used again.

## D-6 Test names

- **Decision**: `CT-142-1` for 002 FR-048; `CT-142-<100+n>` for requirement n. F142-FR-074 is proven by `CT-142-1`.
- **Rationale**: the pattern of feature 100; one test id per requirement keeps the coverage check simple. The brief asks for one test per rule; `tasks.md` names the rules each test proves.

## D-7 Reasons for a layer switched off inside a run

- **Decision**: a closed set of its own, apart from the fallback reasons of launch.
- **Rationale**: annex X row 60 holds the eight reasons of the preconditions. R29 and R29v name further causes (two failed groups, a harness error, an empty inner set, a missing object, a broken ledger, a changed plan, an incomplete application) without a set. A reader of the `[LOOP]` line needs them told apart.
- **Alternatives considered**: widen row 60 (it is closed in feature 100 with eight members).
- **State on 2026-09-30**: the set is row 185 of annex X §X.6; the sources of a scope are row 186. Both name this feature as owner.

## D-8 Facts that stay `unverified`

| Fact | Check | Who captures it |
|---|---|---|
| The sandbox of a tested harness adapter confines the harness's own file tools to a write root other than the workspace | A worker at C2 tries to write the workspace with its edit tool | The harness adapter features |
| Several headless processes run under one configuration home and one login | Two passes at once, separate session stores | The harness adapter features |
| A sandbox can deny reads of paths outside the working tree | A critic with read-only tools tries to read the worker root | The harness adapter features |
| Every macOS statement | The macOS runner of the release | The release |

Recorded on 2026-10-02 by **T107** and **T106**: all four facts are carried, each with its
reason, in `.specstride/features/142-parallel-units/VERIFICATION-RECORD.md`, and the `status:`
fields of **F142-FR-003**, **F142-FR-020** and **F142-FR-070** in `spec.md` name that record and
the feature that captures the fact (the harness adapter features — not this one). This feature
captures none of the four: it reads the containment level, `concurrentSessions` and the state of
the harness from the registry through EP-02, and names no harness. The macOS row is D-10 below.

## D-9 The saving

- **Decision**: stated as R29 F-2 and R29v V-27 give it: a ceiling of about 3 to 4 per cent of alive time at 2 workers before any cost. No target is set.
- **Rationale**: ruling P10. A default cannot be shown at the size of E6.

## D-10 The platform run (T106)

**Decision**: the three suites `tests/parallel/142`, `tests/inertness/142` and
`tests/conformance/142` are run on each platform of the release; **every macOS statement of this
feature stays `unverified` until the macOS runner has passed them**.

**State on 2026-10-02.**

| Platform | Run | Result |
|---|---|---|
| Linux (`Linux 7.0.14-15-pve x86_64`, Node v22.23.2) | `npm test -- tests/parallel/142`; `npm test -- tests/inertness/142`; `npm test -- tests/conformance/142` | **passed**, all three: exit 0, 0 lines matching `^not ok`. 457 of 457 cases in `tests/parallel/142`, 8 of 8 in `tests/inertness/142`, 9 of 9 in `tests/conformance/142`; in the whole chained run of each, 0 failures and the 11 pre-existing skips of `tests/parity/100/supervision-outcomes.test.ts` (feature 141 is not built). Transcripts: `.specstride/features/142-parallel-units/gates/proofs/gate-commands-phase8.txt` |
| macOS | not run | **`unverified` — not run.** No macOS runner is available to this lane, and the owner's ruling of 2026-09-30 (the OPERATOR SLOT) forbids running or faking an out-of-band step in Stage B. The task is recorded with its reason in `.specstride/features/142-parallel-units/VERIFICATION-RECORD.md`; the macOS runner of the release runs it |

**What stays `unverified` until that run passes**, and nothing beyond it:

- the `status:` line of **F142-FR-009** (`spec.md`): "scope comparison on a file system that
  ignores case, on macOS". The rule itself — case folding and Unicode normalisation before a
  scope is compared with the paths of a delta — is implemented in
  `packages/layer-parallel/src/scope.ts` and proved on Linux by `CT-142-109`
  (`tests/parallel/142/ct-142-109-scope-form-and-comparison.test.ts`), which drives the folding
  path explicitly rather than relying on the platform to be case-insensitive. What macOS adds is
  the *platform* reading of that rule on a file system that really does ignore case;
- the row "Every macOS statement" of D-8 above.

**Rationale**: ruling 67 and the prerequisites of `quickstart.md` ("Linux. On macOS every result
is `unverified` until the macOS runner has passed"). A statement no run has shown is marked, not
assumed; and an out-of-band step is never reported as passed when it did not run.
