# Feature Specification: Parity oracle

**Feature Branch**: `141-parity-oracle` (a label: Spec Kit creates no branch in this repository; the directory is `specs/141-parity-oracle`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 141-parity-oracle: the differential parity oracle of Specstride, the release condition. Reference trees at the pinned baseline commits, hermetic environment, scripted stub agents and their transcripts, fixture families FX-01 to FX-37 and new ones, the scenarios of dsh, Codex and prime, captured surfaces, the normalizer for N-01 to N-28, the comparator with three results, waivers keyed to register rows, the exercise map, per-OS expectations, the second suite, the coverage script."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` (sections 2, 8, 12, 14, 16), `consolidation.md` (sections 1, 3, 4, 5, 6), `feature-briefs.md` (brief 141-parity-oracle, sections D.5 and D.8), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), `research/R18-behaviour-inventory-parity-oracle.md` (O-1 to O-12), `traceability.md` (sections 1 and 5), and feature 100 (`specs/100-specstride/`, annexes X, G, E, B).

## What this feature is

Three systems become one product. Two of them, Specstride and mixture-of-loops, are the reference
for behaviour. The parity oracle runs the reference and the new product on the same fixtures, with
scripted stub agents in place of every model, and compares what each side leaves behind. The owner
ruled that every parity test passes before any release (ruling 32). The oracle is therefore the
release condition of the product.

The oracle is a development tool. It is never part of the product package, and the product has no
oracle mode: the oracle runs the product under the named profile `parity`, which is ordinary
configuration owned by feature 100.

The other features of Wave 1 cite this specification; there were thirty when it was written and there are forty after the splits. Each of their parity tests names a fixture family,
a set of compared surfaces and the behaviour it proves. The section "How a feature cites the
oracle" is written for them and is normative.

**In scope**: the reference trees at the pinned commits; the hermetic environment; the stub
agents and their transcripts; the fixture families and their scenarios, those of dsh, Codex and
prime included; the captured surfaces; the normalizer that implements the rules of feature 100;
the comparator and its three results; waivers keyed to rows of the divergence register; the
exercise map; per-OS expectations; the second suite; the coverage script; committed golden
captures and the live differential run.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The text of the normalization rules, the layout tables, the alias table, the component-name table and the further maps | 100 (annex X §X.8). This feature implements them |
| The `parity` profile | 100 (annex X §X.7) |
| The compatibility projection that the oracle compares | 111 |
| Compatibility output lines | 119, 123 |
| Conformance suites of extension points | 100 for the rule; each content owner for its suite |
| The own tests of the micro-loop layer and experiment X12 | 115 |
| The own tests of parallel units and experiment E6 | 142 |
| Recorded streams of a harness, replayed in the conformance suite of a harness adapter | 125, 130, 131, 134, 138. They are not oracle fixtures |
| Characterization tests of kept Lisa behaviours | The feature that keeps the behaviour |
| The traceability files, the behaviour inventory and the divergence register | `docs/ecosystem/`, the single copies. This feature reports corrections and never writes them |

## How a feature cites the oracle

This section is normative. Its subsections have stable numbers. An id given here (a fixture
family, a scenario, a stub verb, a surface) is never reused and never renamed.

How to cite: "feature 141, §O.2, FX-12" for a family; "feature 141, §O.4, `transcript`" for a
surface; "feature 141, §O.3, proposer verb `yield`" for a stub verb.

### §O.1 The rules in short

| # | Rule |
|---|---|
| 1 | A parity test runs one or more scenarios of fixture families of §O.2 and compares the surfaces of §O.4 that it names |
| 2 | A parity test declares `proves:`, `fixture:` and `surfaces:` as in §O.6. A test without all three is not a parity test |
| 3 | A feature cites a family by its id. It may cite a scenario as `FX-nn/<scenario>`. It never cites a file of the oracle |
| 4 | A feature may add a scenario to a family, inside the scope the catalogue states for that family, using only the stub verbs of §O.3 and the surfaces of §O.4 (F141-FR-030) |
| 5 | A feature never adds a fixture family, a stub verb, a surface, a normalization rule or a waiver by itself. It reports the need; families, verbs and surfaces are added here, rules in feature 100, waivers only with a register row |
| 6 | A test may claim a behaviour item only if its fixture executed the evidence line of that item on the reference (§O.6, F141-FR-032) |
| 7 | A result other than `equal` or `waived (<register row>)` blocks a release (§O.5) |
| 8 | Behaviour with no reference has no parity test. §O.7 says what it has instead |

### §O.2 Catalogue of fixture families

"Reference" names the baseline and the entry point that the scenario drives: **S** is the
Specstride baseline at `9cab15d`, **M** is the mixture-of-loops baseline at `9c88f86`. Entry points
are named by the logical component names of feature 100, annex X §X.8. On the port side the entry
point is the command of CLI protocol 1 (feature 100, annex G §G.1) that carries the same behaviour.

Stubs: **P** proposer, **CH** critic over HTTP, **CC** critic as a CLI, **D** diagnostician,
**E** engine, **V** verification commands, **I** plugin installer, **T** telemetry sink, **G** the
generic descriptor-driven harness. They are defined in §O.3.

Surfaces are named as in §O.4. "Run set" means `exit`, `stdout`, `stderr`, `tree`, `state`,
`events`, `transcript`, `processes` and `home`.

"Features covered" lists the features whose kept traceability rows name the family, as the
traceability files stand after the splits of 2026-09-29 and with the corrections this feature
has reported. The exercise map confirms or corrects each assignment (F141-FR-033). The column
limits nothing: a test may cite any active family whose scenario executes what it proves.

| Id | Name | Exercises | Reference | Stubs | Surfaces | Features covered |
|---|---|---|---|---|---|---|
| FX-01 | All phases approved first time | The core loop, ticking of tasks, the final event of a run, the proposer and critic invocation of each harness with as-is behaviour | S, `front-door` `run` | P, CH, CC | Run set | 100, 101, 106, 109, 111, 124, 125, 130, 131, 138, 144, 145 |
| FX-02 | Reject then approve | Archive of a rejected phase attempt, feedback, numbering of phase attempts | S, `front-door` `run` | P, CH | Run set | 101 |
| FX-03 | Reject limit reached | Engine exit 2, the last phase attempt left unarchived | S, `front-door` `run` | P, CH | Run set | 100, 101, 102, 103, 105 |
| FX-04 | Oscillation | The oscillation halt and its thresholds | S, `front-door` `run` | P, CH | Run set | 100, 101 |
| FX-05 | MALFORMED variants and limit | The verdict grammar, the MALFORMED limit, engine exit 1 | S, `front-door` `run` | P, CH | Run set | 100, 101, 109, 125 |
| FX-06 | Critic transport failure | Scoring of a failed critic call as MALFORMED, on each transport | S, `front-door` `run`; `critic` | P, CH, CC | Run set | 101, 109, 125, 130, 131, 138, 148 |
| FX-07 | Critic configuration error | Where an error of the configuration of the critic ends. An error that the critic finds before its call (the phase is not in the spec; the spec or the phase evidence is missing; the format or the verification plan is invalid) ends with critic exit 3, engine exit 3 and the stop reason `critic_config`. An error that is raised inside the call (a missing key, an unknown harness name, an invalid reference of a harness) is scored MALFORMED and ends at the MALFORMED limit with engine exit 1 and the stop reason `critic_unavailable` | S, `front-door` `run`; `critic` | P, CH, CC | Run set | 100, 101, 124, 130, 131, 138 |
| FX-08 | Diagnostician and accelerator | The recovery cycle: signature markers, one diagnosis per signature | S, `front-door` `run` | P, CH, D | Run set | 101, 102, 103, 118 |
| FX-09 | Spec resolution order and ambiguity | Resolution order, the listings of exit 3 | S, `front-door` `run`, `phases`; `spec` | none | `exit`, `stdout`, `stderr`, `tree`, `state` | 104 |
| FX-10 | Three spec formats, invalid spec | Grammar and detection of each format | S, `spec`; `front-door` `phases` | none | `exit`, `stdout`, `stderr`, `tree` | 104 |
| FX-11 | Lock held | Engine exit 5 on a second engine start; the form of the lock | S, `front-door` `run` | P, CH | Run set | 100, 105, 109, 118, 122 |
| FX-12 | Stop request at each check point | Engine exit 6; `stop` and `stop --now` | S, `front-door` `run`, `stop` | P, CH | Run set | 100, 102, 118 |
| FX-13 | Resume and replay of settings | Counts on resume, replayed keys, the refusals of `resume` | S, `front-door` `run`, `resume` | P, CH | Run set | 101, 102, 103, 118, 122 |
| FX-14 | Verification modes | `off`, `plan`, `required`; the verification gate before the critic; synthetic feedback | S, `front-door` `run`; `verification` | P, CH, V | Run set | 105, 148 |
| FX-15 | Release verification failure | Engine exit 2 with the stop reason `release_verification` | S, `front-door` `run`; `verification` | P, CH, V | Run set | 101, 105, 148 |
| FX-16 | Pre-staged and detached verification commands | Reuse rules of results, long detached jobs | S, `front-door` `run`; `verification` | P, CH, V | Run set | 102, 105, 118, 130, 148 |
| FX-17 | Iteration limit | Pass-loop exit 4 to engine exit 4 | S, `front-door` `run`; `pass-loop` | P, CH | Run set | 100, 103, 130 |
| FX-18 | Consecutive errors | Pass-loop exit 7 to engine exit 4; a pass that fails before the harness starts. On the structured path such a pass is an error and the loop ends with pass-loop exit 7. On the plain-output path it is no error, and the no-progress breaker ends the loop with pass-loop exit 8 | S, `front-door` `run`; `pass-loop` | P, CH | Run set | 103, 124, 130, 138 |
| FX-19 | No progress | Pass-loop exit 8 on the plain-output path; no evaluation on the structured path | S, `front-door` `run`; `pass-loop` | P, CH | Run set | 103, 130 |
| FX-20 | Hard cap kills | Pass-loop exit 10, kill notes | S, `front-door` `run`; `pass-loop` | P, CH | Run set | 103, 105, 118, 130 |
| FX-21 | Idle, progress and repetition watchdogs | The kill reasons and their classes | S, `front-door` `run`; `pass-loop` | P, CH | Run set | 101, 103, 109, 118 |
| FX-22 | Yield | Each predicate, the limit, the deadline, the refusal; pass-loop exit 9 | S, `front-door` `run`; `pass-loop` | P, CH, V | Run set | 102, 103, 105, 118, 127, 130 |
| FX-23 | Wall-clock budget | The stop reason `wall_budget` | S, `front-door` `run` | P, CH | Run set | 101, 102, 118, 127 |
| FX-24 | Short-pass nudge | The prompt block and its event | S, `front-door` `run`; `pass-loop` | P, CH | Run set | 103, 118, 130 |
| FX-25 | Grounding snapshot | Caps, budgets, wildcard, placeholder, missing file, context windows per harness | S, `critic`; `front-door` `run` | P, CH, CC | `exit`, `stderr`, `state`, `events`, `transcript` | 117, 130, 131 |
| FX-26 | Stream formats through the seam | The event vocabulary of each stream format, the three fallbacks of the seam, the proposer invocation of each harness | S, the stream tap; `pass-loop` | P, G | `exit`, `stdout`, `stderr`, `state`, `events`, `transcript` | 109, 111, 126, 130, 131, 138, 144 |
| FX-27 | Commit after approval | The commit message; no push | S, `front-door` `run` | P, CH | Run set, `repository` | 101, 102 |
| FX-28 | Front-door inspection commands | Output lines and exit codes of the inspection commands and of `status` in compatibility output | S, `front-door` | none | `exit`, `stdout`, `stderr`, `tree`, `state` | 119, 145 |
| FX-29 | Learning | Show, advise, apply, revert, off, evaluate; the allowlist, the sample floors, quarantine | S, `learning`; `front-door` `learn` | none | `exit`, `stdout`, `stderr`, `state`, `events` | 106 |
| FX-30 | Reverse | Plan, the finding codes of reverse lint, the reverse guard | S, `reverse`, `reverse-inventory`; `front-door` `reverse` | P, E | `exit`, `stdout`, `stderr`, `tree`, `state` | 108, 140 |
| FX-31 | Telemetry shippers against a local sink | Payload shapes | S, the two shippers | T | `exit`, `stderr`, `telemetry`, `state` | 128 |
| FX-32 | Derivation of a launch contract | `greeting-ready`, `greeting-blocked`, ambiguity; inventory and draft | M, `contract-derive` | none | `exit`, `stdout`, `stderr`, `tree`, `state` | 104, 107, 141 |
| FX-33 | Validate and promote | Each error class, staleness, the learning binding; exits 20 and 23 | M, `contract-validate`; `launcher-render` for `invalid-not-promoted` | none | `exit`, `stdout`, `stderr`, `state` | 100, 104, 106, 107 |
| FX-34 | Render | The stamp, an edited launcher, reuse of a launch bundle | M, `launcher-render` | none | `exit`, `stdout`, `stderr`, `launcher`, `state` | 107 |
| FX-35 | Launcher and pipeline runtime | Dry run, launch checks of the pipeline, stages, recovery, pipeline resume, signals, lock; the digest; exits 20 to 24 and 128+N | M, the launcher and `pipeline-runtime` | E; in the second run P, CH | Run set, `pipeline`, `launcher` | 100, 106, 122, 123 |
| FX-36 | Supervisor | Mode and learning selection, launch check, launch, observe, relaunch classifier, stop, retrospective; the supervisor lines; the exit map | M, `supervisor` | E; in the second run P, CH | Run set, `pipeline` | 100, 106, 122, 123 |
| FX-37 | Onboarding | **Retired.** No differential test is possible (DV-056). The family has no scenario and is cited by no test | — | — | — | none |
| FX-38 | dsh plugin request protocol | The request file, its validation, the allowlist, the installer call, the receipt, the restart pass, the exemption from breakers, the three ends (restart, exit 7, exit 4) | S, `pass-loop`; the plugin request processor | P, CH, I | Run set | 130 |
| FX-39 | Declared overlay of the configuration home | An overlay declared for a harness: the scopes `pass` and `attempt`, population, the signals with a phase-attempt scope, removal; the throwaway home of dsh for a model override | S, `pass-loop`; the overlay tool; `critic` | P, CC, G | Run set | 109, 130 |
| FX-40 | Rendering on a terminal | The presenter, the banner and the theme on a pseudo-terminal: colour detection and depth, the background, glyphs, width tiers, the live timeline, the card, escape sequences as written; and the timeline where no terminal is present | S, `front-door`; the presenter, the banner and the theme tool | P, CH | `exit`, `stdout`, `stderr` | 145 |

New families and the reservation each answers:

| Family | Reservation of `traceability.md` section 5 | Why a new family |
|---|---|---|
| FX-38 | Item 17: no family exercises the dsh plugin request protocol (27 items: C-036 to C-040, and the plugin items of C-052, C-053, C-054, C-056, C-057, C-058) | The protocol has three ends. Two of them equal the ends of FX-17 and FX-18 by exit code only; the third, an installed plugin and a restart pass that then delivers phase evidence, is the subject of neither. The subject of FX-17 and FX-18 is a breaker, and a pass that ends with an install is exempt from every breaker (B-0769) |
| FX-39 | Item 2: no family declares an overlay (53 items of 109 and 8 items of 130, listed in `followup/proof-column-changes.tsv`; the reservation counted 51 of 109) | FX-26 runs with overlay scope `none`, as every as-is fixture does. An overlay changes the home and the environment of every pass, so it cannot be a scenario of a family whose other scenarios assume scope `none` |
| FX-40 | Item 3: terminal rendering, colour detection and the live timeline need a pseudo-terminal (96 of the 121 kept items of C-081 to C-086 and C-096 to C-107, listed in `followup/proof-column-changes.tsv`) | Every other family runs with colour off and no terminal (N-21). FX-28 keeps the 15 items of the presenter that the inspection commands reach in plain and quiet mode; 10 items of the plain banner are reached by every run and belong to FX-01 |

Where the traceability files name FX-17 or FX-18 for an item of the plugin protocol, FX-26 for an
item of an overlay, or FX-28 for an item that needs a terminal, the parity test cites the new
family. The correction of the traceability files is reported to the orchestrator, item by item,
in `followup/proof-column-changes.tsv`; until it is made, both citations are valid.

**Scenarios.** Each family has named scenarios. The names below are the first set, which this
feature delivers. A name with a part in angle brackets is a pattern; its members are in the table
"Members of the pattern names". The complete list, with the scenarios that other features own,
is data of the plan (`contracts/fixture-catalogue.json`).

| Family | Scenarios |
|---|---|
| FX-01 | `three-phases`; `single-phase`; `harness-claude`; `harness-dsh`; `harness-dsh-model-override`; `harness-codex`; `harness-prime` (waiver DV-112); `harness-prime-variant` (waiver DV-112); `harness-generic`; `defaults-no-role-named` (waiver DV-004) |
| FX-02 | `reject-approve`; `reject-twice-approve`; `archive-collision` |
| FX-03 | `reject-limit`; `reject-limit-of-one` |
| FX-04 | `oscillation-halt`; `oscillation-below-threshold` |
| FX-05 | `no-verdict`; `wrong-nonce`; `duplicate-verdict`; `empty-reply`; `malformed-limit` |
| FX-06 | `http-error`; `http-hang`; `cli-nonzero-exit`; `cli-empty-output`; `dsh-error-on-stdout`; `prime-critic-error` (waiver DV-112) |
| FX-07 | `missing-key`; `unknown-harness-name`; `dsh-conflicting-providers`; `dsh-invalid-model-ref`; `prime-empty-variant`; `codex-missing-key`; `phase-not-found`; `critic-spec-missing`; `critic-format-invalid`; `critic-phase-not-found`; `critic-plan-invalid`; `critic-evidence-missing` |
| FX-08 | `new-signature-hint`; `same-signature-no-second-hint`; `accelerated-attempt`; `diagnostician-fails` |
| FX-09 | `explicit-path`; `feature-flag`; `single-candidate`; `ambiguous-candidates`; `no-candidate` |
| FX-10 | `native`; `speckit-tasks`; `openspec-change`; `invalid-spec`; `unknown-format`; `explicit-openspec` (waiver DV-073) |
| FX-11 | `second-run-refused`; `lock-form`; `stale-lock` (waiver DV-022); `orphaned-child` (waiver DV-022) |
| FX-12 | `stop-before-phase`; `stop-between-passes`; `stop-during-yield`; `stop-now`; `stop-with-no-run` |
| FX-13 | `resume-after-reject-limit`; `resume-pinned-keys`; `resume-lock-held`; `resume-nothing-to-resume`; `resume-tunable-key-in-environment` (waiver DV-024); `resume-unsaved-setting` (waiver DV-024); `snapshot-write-fails` (waiver DV-024); `planted-approval-marker` (waiver DV-029) |
| FX-14 | `mode-off`; `mode-plan`; `mode-required-pass`; `mode-required-fail`; `generate-tests-upgrades-off` |
| FX-15 | `release-verification-fails`; `release-verification-passes` |
| FX-16 | `pre-staged-reused`; `pre-staged-stale`; `long-job-running`; `long-job-finished` |
| FX-17 | `iteration-limit`; `iteration-returned-by-yield` |
| FX-18 | `consecutive-errors-legacy`; `consecutive-errors-structured`; `harness-missing-dsh`; `harness-missing-prime`; `harness-missing-prime-launcher`; `dsh-model-and-qualifier`; `dsh-no-provider`; `prime-variant-with-model`; `dsh-overlay-cannot-build`; `unknown-harness-name`; `prime-empty-variant` |
| FX-19 | `no-progress-legacy`; `no-progress-structured-not-evaluated` |
| FX-20 | `cap-exhausted-legacy`; `cap-exhausted-structured`; `kill-note-carried` |
| FX-21 | `idle-timeout`; `progress-stall`; `repeat-stall`; `crash-reads-clean` |
| FX-22 | `predicate-<kind>` for each kind of predicate; `yield-limit`; `yield-deadline`; `yield-refused`; `yield-timeout` |
| FX-23 | `wall-budget` |
| FX-24 | `short-pass-nudge`; `yield-leaves-counter` |
| FX-25 | `file-cap`; `byte-budget`; `wildcard-match`; `placeholder`; `missing-file`; `window-per-harness`; `evidence-cites-state-path` (waiver DV-032) |
| FX-26 | `claude-<name>` for each as-is input stream of the Claude format; `prime-v3-<name>` for each of the ten as-is input streams of the prime format (waiver DV-112); `dsh-text`; `codex-text`; `generic-text`; `fallback-<reason>` for each of the three fallback reasons; `pass-through` |
| FX-27 | `commit-per-phase`; `commits-off` |
| FX-28 | `<command>-<case>` for each inspection command and for `status`; `flag-without-value` |
| FX-29 | `show`; `advise-no-telemetry`; `apply`; `revert`; `off`; `evaluate`; `below-sample-floor`; `quarantined` |
| FX-30 | `plan`; `lint-<code>` for each finding code; `guard-refuses`; `refused-flag` |
| FX-31 | `loki-payload` (waiver DV-107); `otlp-payload` (waiver DV-107); `sink-down`; `metric-names` (waiver DV-058); `delivery-status` (waiver DV-058) |
| FX-32 | `greeting-ready`; `greeting-blocked`; `ambiguous-feature`; `tasks-unreadable-by-old-grammar` (waiver DV-060) |
| FX-33 | `valid`; `invalid-<class>` for each error class; `stale-sources`; `learning-decisions-changed`; `promote` |
| FX-34 | `render`; `edited-launcher`; `bundle-reused`; `stale` |
| FX-35 | `dry-run`; `preflight-fails`; `stages-complete`; `stage-fails`; `stage-timeout`; `in-stage-retry`; `pipeline-resume`; `signal-<name>` for three signals; `lock-held`; `second-pipeline-on-held-workspace` (waiver DV-075); `stale-sources`; `invalid-launch-contract`; `colour-always`; `colour-never`; `setup-without-implement`; `precondition-fails`. Each runs as `@engine-stub` and as `@full-stack` |
| FX-36 | `mode-<case>` for each token, refusal and prose case; `mode-no-execution-phrasing` (waiver DV-009); `learning-selection`; `gate-<refusal>` for each launch-check refusal; `gate-attach`; `launch`; `observe-<status>`; `relaunch-<decision>` for each relaunch refusal and for the approval; `stop`; `retro`; `observe-cadence`. Each runs as `@engine-stub` and as `@full-stack` |
| FX-38 | `no-request-file`; `installed-then-restart`; `installed-on-final-pass`; `allowlist-empty`; `denied-not-in-allowlist`; `invalid-request-<case>` for each rule of the request schema; `installer-fails`; `installer-times-out`; `request-and-evidence-in-one-pass`; `qualified-harness-never-processed`; `invalid-allowlist-entry` |
| FX-39 | `scope-pass`; `scope-attempt`; `scope-attempt-signal`; `invalid-declaration`; `populate-fails`; `dsh-settings-overlay`; `dsh-reasoning-effort` |
| FX-40 | `banner`; `timeline-live`; `colour-detected`; `colour-never`; `banner-width-full`; `banner-width-compact`; `banner-width-line`; `banner-flags`; `banner-motion-off`; `banner-switched-off`; `colour-depth-16`; `colour-depth-256`; `colour-depth-truecolor`; `colour-forced`; `colour-override`; `background-set`; `background-query`; `theme-usage`; `glyphs-ascii`; `timeline-events`; `timeline-detail-milestones`; `timeline-detail-full`; `timeline-debug`; `timeline-no-terminal`; `timeline-stop-requested`; `timeline-narrow`; `card`; `card-stop-resume` |

**Members of the pattern names.** Resolved on 2026-09-29 against the closed sets of feature 100,
annex X §X.6, as they stand after the splits, and against the baselines. A member of a closed
set that is new in the product has no reference and therefore no scenario (§O.7). The count is
175 members of 13 pattern names.

| Family | Pattern | Members | Closed set, owner and baseline |
|---|---|---|---|
| FX-22 | `predicate-<kind>` | `predicate-pid`; `predicate-exit-code-file`; `predicate-file-exists`; `predicate-file-stable`; `predicate-grep`; `predicate-command` | Feature 100, annex X §X.6 row 69, owner 118. Six of the seven kinds: the kind `first_failure` is new and has no reference. Baseline: the pass-loop script, line 1250 |
| FX-26 | `claude-<name>` | `claude-empty`; `claude-adapter-exposes-terminal-without-result-event`; `claude-adapter-preserves-visible-event-mapping-and-exact-evidence`; `claude-tool-target-is-redacted-before-live-output`; `claude-legacy-cli-keeps-one-result-event`; `claude-evidence-event`; `claude-init-event`; `claude-legacy-cli-event-sequence`; `claude-result-terminal`; `claude-text-event`; `claude-tool-event`; `claude-cli-early-eof-emits-exactly-one-synthesized-result`; `claude-cli-successful-stream-keeps-single-unchanged-result`; `claude-early-eof-synthesizes-one-failing-terminal`; `claude-finish-is-idempotent-and-synthesizes-at-most-once`; `claude-provider-error-result-is-preserved-not-replaced`; `claude-successful-result-is-not-resynthesized-on-finish`; `claude-stream-fixture` | No closed set. The 18 as-is input streams of the Claude format that are imported (F141-FR-012); the name is the name of the as-is file without its prefixes. One further as-is stream belongs to the locally registered backend and is not imported. Tests: 125, 126, 144 |
| FX-26 | `prime-v3-<name>` | `prime-v3-empty`; `prime-v3-fleet-evidence`; `prime-v3-fleet-ipython`; `prime-v3-fleet-text`; `prime-v3-malformed`; `prime-v3-stock-auth-error`; `prime-v3-stock-retry`; `prime-v3-stock-success`; `prime-v3-truncated`; `prime-v3-unknown-record` | No closed set. The ten as-is input streams of the prime format. Tests: 138, 126 |
| FX-26 | `fallback-<reason>` | `fallback-capture-disabled`; `fallback-tap-unavailable`; `fallback-no-adapter` | Feature 100, annex X §X.6 row 171, owner 126. Baseline: the pass-loop script, lines 337, 339 and 341. Only `fallback-capture-disabled` was run on the reference; whether a fixture can reach the other two on a read-only reference tree is for the exercise map |
| FX-28 | `<command>-<case>` | `status-ok`; `status-all`; `status-no-state`; `status-no-feature`; `tail-ok`; `tail-no-log`; `events-ok`; `events-json`; `events-no-events`; `verdicts-ok`; `verdicts-no-verdicts`; `verdicts-no-verdict-for-phase`; `feedback-ok`; `feedback-usage`; `feedback-no-feedback`; `phases-ok`; `phases-no-spec`; `phases-spec-invalid`; `help-usage`; `unknown-subcommand` | Feature 100, annex X §X.6 row 158, owner 119, for the cases; the commands are the inspection commands of feature 119 and `status`. Baseline: the front-door script, lines 252 to 534 and 720 |
| FX-30 | `lint-<code>` | `lint-template-mandatory`; `lint-template-family`; `lint-template-expected`; `lint-placeholder`; `lint-structure-extra`; `lint-structure-contracts`; `lint-structure-required`; `lint-evidence-format`; `lint-evidence-kind`; `lint-evidence-confidence`; `lint-evidence-validation`; `lint-evidence-disproved`; `lint-evidence-citation`; `lint-evidence-contradicts`; `lint-evidence-missing`; `lint-evidence-skipped`; `lint-unknowns-placement`; `lint-spec-fr-format`; `lint-spec-sc-format`; `lint-spec-fr-unique`; `lint-spec-sc-unique`; `lint-spec-story-format`; `lint-spec-story-numbers`; `lint-spec-story-parts`; `lint-spec-clarifications`; `lint-research-decisions`; `lint-data-model-entities`; `lint-checklist-items`; `lint-tasks-grammar`; `lint-tasks-line-format`; `lint-tasks-ids`; `lint-tasks-phase-order`; `lint-tasks-story-labels`; `lint-tasks-story-exists`; `lint-tasks-parallel-files`; `lint-tasks-mode`; `lint-coverage-fr`; `lint-claims-missing` | Feature 100, annex X §X.6 row 146, owner 140 (moved from 108 in the split). One scenario per finding code; the dot of a code is written as a hyphen, because a scenario name holds no dot |
| FX-33 | `invalid-<class>` | `invalid-unreadable`; `invalid-structure`; `invalid-action`; `invalid-check`; `invalid-verification-commands`; `invalid-learning`; `invalid-auto`; `invalid-open-blocker`; `invalid-unchecked-prerequisite`; `invalid-not-promoted` | Feature 100, annex X §X.6 row 274, owner 107 (F107-FR-040): the ten validators of the baseline, the contract library of mixture-of-loops at `9c88f86`, lines 111 to 117, 248, 293, 196, 483, 536, 932, 935 and 969. At the baseline only the renderer raises `not-promoted` (line 969, called by the render script), so `invalid-not-promoted` is driven through the entry point `launcher-render`; the other nine through `contract-validate`. Owner of the tests: 107. assumption: CQ-194 |
| FX-35 | `signal-<name>` | `signal-int`; `signal-term`; `signal-hup` | Owner 123. Baseline: the pipeline runtime of mixture-of-loops, line 588 |
| FX-36 | `mode-<case>` | `mode-token-auto`; `mode-token-run`; `mode-token-generate`; `mode-refusal`; `mode-refusal-dry-run`; `mode-prose-auto`; `mode-prose-run`; `mode-prose-generate-then-run`; `mode-default` | Feature 100, annex X §X.6 row 107, owner 123: the three tokens and the sources `refusal`, `prose` and `default`. Baseline: the supervisor library, lines 179 to 211 |
| FX-36 | `gate-<refusal>` | `gate-launcher-not-found`; `gate-launcher-edited`; `gate-learning-decisions-changed`; `gate-stale-sources`; `gate-open-blocker`; `gate-draft-contract`; `gate-invalid-contract`; `gate-unauthorized-root`; `gate-launcher-syntax-error`; `gate-dry-run-failed` | Feature 100, annex X §X.6 row 13, owner 123. Ten of the eleven members; the eleventh, `already-running`, is the scenario `gate-attach`. Baseline: the supervisor library, lines 455 to 544 |
| FX-36 | `observe-<status>` | `observe-running`; `observe-starting`; `observe-lock-conflict`; `observe-completed`; `observe-failed`; `observe-stopped`; `observe-unknown-terminal` | Feature 100, annex X §X.6 row 106, owner 123. Baseline: the supervisor library, line 829 |
| FX-36 | `relaunch-<decision>` | `relaunch-disabled`; `relaunch-still-running`; `relaunch-operator-stop`; `relaunch-completed`; `relaunch-deliberate-stop`; `relaunch-unknown-terminal`; `relaunch-lock-conflict`; `relaunch-unknown-launcher-exit`; `relaunch-signal-stop`; `relaunch-invalid-contract`; `relaunch-preflight-blocked`; `relaunch-stale-sources`; `relaunch-state-not-failed`; `relaunch-unknown-stage`; `relaunch-postcondition-failure`; `relaunch-stage-precondition`; `relaunch-setup-required`; `relaunch-interrupted`; `relaunch-stage-did-not-run`; `relaunch-stage-did-not-fail`; `relaunch-exec-error`; `relaunch-stage-reason-not-transient`; `relaunch-child-exit-not-retryable`; `relaunch-stop-reason-not-allowed`; `relaunch-contract-digest-changed`; `relaunch-learning-decisions-changed`; `relaunch-launcher-edited`; `relaunch-budget-exhausted`; `relaunch-budget-deadline-exceeded`; `relaunch-launcher-exit-unknown`; `relaunch-classified-transient` | Feature 100, annex X §X.6 row 14, owner 123: the 29 refusals of the table `relaunch-observe` that are literals, one scenario for an exit code of the launcher outside the table, and the approval `classified-transient`. The five members that the table `relaunch-root` adds are new and have no reference. Baseline: the supervisor library, lines 962 to 1053 |
| FX-38 | `invalid-request-<case>` | `invalid-request-link`; `invalid-request-not-regular`; `invalid-request-too-large`; `invalid-request-json`; `invalid-request-keys`; `invalid-request-contract`; `invalid-request-plugins`; `invalid-request-plugin-spec`; `invalid-request-duplicate`; `invalid-request-reason` | Feature 100, annex X §X.6 row 217, owner 130. Baseline: the plugin request processor, lines 45 to 69 |

**Ends on the reference.** For the scenarios of the critic families and the harness families the
catalogue states how the driven command ends on the reference, with the default limits of the
baseline (reject limit 3, MALFORMED limit 3, two consecutive errors, three passes without
progress). "run" means that the end was seen on the reference at `9cab15d` on 2026-09-29, with
stub agents and no model; "read" means that it was read from the code and not yet run. The
table records the reference. Where a capture of the reference differs from it, the capture
stands and the table is corrected (F141-FR-013).

| Scenario | Entry point | End of the driven command | Stop reason | Evidence at the baseline | Known by |
|---|---|---|---|---|---|
| `FX-06/http-error` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, line 2730; the engine script, lines 2163 to 2182 | run |
| `FX-06/http-hang` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, lines 2730 and 2738; the engine script, lines 2163 to 2182 | read |
| `FX-06/cli-nonzero-exit` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, lines 2181 and 2738 | read |
| `FX-06/cli-empty-output` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, lines 2184 and 2738 | read |
| `FX-06/dsh-error-on-stdout` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, lines 2181 and 2738 | read |
| `FX-06/prime-critic-error` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, lines 2219 and 2738 | read |
| `FX-07/missing-key` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, line 1883; the handler at lines 2730 to 2743; the engine script, lines 2163 to 2182 | run |
| `FX-07/unknown-harness-name` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, line 2395; the handler at lines 2730 to 2743; the engine script, lines 2163 to 2182 | run |
| `FX-07/dsh-conflicting-providers` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, line 1963; the handler at lines 2730 to 2743; the engine script, lines 2163 to 2182 | run |
| `FX-07/dsh-invalid-model-ref` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, line 1978; the handler at lines 2730 to 2743; the engine script, lines 2163 to 2182 | run |
| `FX-07/prime-empty-variant` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, line 2370; the handler at lines 2730 to 2743; the engine script, lines 2163 to 2182 | run |
| `FX-07/codex-missing-key` | `front-door` `run` | engine exit 1 after three phase attempts, each scored MALFORMED | `critic_unavailable` | The critic module, line 1904; the handler at lines 2730 to 2743; the engine script, lines 2163 to 2182 | run |
| `FX-07/phase-not-found` | `front-door` `run` | critic exit 3, engine exit 3, in the first phase attempt; no count changes | `critic_config` | The critic module, line 2545; the engine script, lines 2133 to 2136 | run |
| `FX-07/critic-spec-missing` | `critic` | critic exit 3 | none: the critic writes no stop reason | The critic module, line 2533 | run |
| `FX-07/critic-format-invalid` | `critic` | critic exit 3 | none | The critic module, line 2542 | run |
| `FX-07/critic-phase-not-found` | `critic` | critic exit 3 | none | The critic module, line 2545 | run |
| `FX-07/critic-plan-invalid` | `critic` | critic exit 3 | none | The critic module, line 2554 | run |
| `FX-07/critic-evidence-missing` | `critic` | critic exit 3 | none | The critic module, line 2562 | run |
| `FX-17/iteration-limit` | `front-door` `run` | pass-loop exit 4, engine exit 4 | `proposer_max_iter` | The pass-loop script, line 2365; the engine script, lines 1888 to 1891 | run |
| `FX-17/iteration-returned-by-yield` | `front-door` `run` | the iteration limit is NOT reached: a yield hands the iteration back, so the pass that yielded and the pass that resumed are one logical pass; the phase is approved and the engine exits 0 | none: no breaker fires | The pass-loop script, line 2142, with the default at line 1218 | run |
| `FX-18/consecutive-errors-legacy` | `pass-loop` | pass-loop exit 7 after two passes that the idle watchdog ended. On the plain-output path a pass that ends with an exit code other than 0 is no error; only a kill by a watchdog is | `proposer_consecutive_errors` | The pass-loop script, lines 2300 to 2335 | run |
| `FX-18/consecutive-errors-structured` | `pass-loop` | pass-loop exit 7 after two passes without a terminal record | `proposer_consecutive_errors` | The pass-loop script, lines 2245 to 2261 | run |
| `FX-18/harness-missing-dsh` | `front-door` `run` | every pass returns 127 and is not counted as an error; pass-loop exit 8, engine exit 4 | `proposer_no_progress` | The pass-loop script, lines 549 and 2343 to 2350; the engine script, lines 1893 to 1906 | run |
| `FX-18/harness-missing-prime` | `front-door` `run` | pass-loop exit 7 after two passes with the reason `launch_failed`, engine exit 4 | `proposer_consecutive_errors` | The pass-loop script, lines 596 and 2245 to 2261; the engine script, lines 1908 to 1921 | run |
| `FX-18/harness-missing-prime-launcher` | `front-door` `run` | pass-loop exit 7 after two passes with the reason `launch_failed`, engine exit 4 | `proposer_consecutive_errors` | The pass-loop script, lines 610 and 2245 to 2261 | run |
| `FX-18/dsh-model-and-qualifier` | `pass-loop` | every pass returns 1 and is not counted as an error; pass-loop exit 8 | `proposer_no_progress` | The pass-loop script, lines 544 and 2343 to 2350 | run |
| `FX-18/dsh-no-provider` | `front-door` `run` | every pass returns 1 and is not counted as an error; pass-loop exit 8, engine exit 4 | `proposer_no_progress` | The pass-loop script, lines 381 and 2343 to 2350 | run |
| `FX-18/prime-variant-with-model` | `pass-loop` | pass-loop exit 7 after two passes with the reason `producer_nonzero` | `proposer_consecutive_errors` | The pass-loop script, lines 611 and 2245 to 2261 | run |
| `FX-18/prime-empty-variant` | `front-door` `run` | pass-loop exit 7 after two passes with the reason `producer_nonzero`, engine exit 4 | `proposer_consecutive_errors` | The pass-loop script, lines 608 and 2245 to 2261 | run |
| `FX-18/dsh-overlay-cannot-build` | `pass-loop` | every pass returns 1; pass-loop exit 8. Not reproduced: the build fails only when a link or the settings file cannot be written, and no fixture made it fail | `proposer_no_progress` | The pass-loop script, lines 557 and 2343 to 2350 | read |
| `FX-18/unknown-harness-name` | `front-door` `run` | every pass returns 127 and is not counted as an error; pass-loop exit 8, engine exit 4 | `proposer_no_progress` | The pass-loop script, lines 640 and 2343 to 2350; the engine script, lines 1893 to 1906 | run |
| `FX-19/no-progress-legacy` | `front-door` `run` | pass-loop exit 8, engine exit 4 | `proposer_no_progress` | The pass-loop script, lines 2343 to 2350 | run |
| `FX-19/no-progress-structured-not-evaluated` | `front-door` `run` | the no-progress breaker is not reached: the structured path goes to the next pass at line 2270 | none from this breaker | The pass-loop script, line 2270 | read |
| `FX-20/cap-exhausted-legacy` | `front-door` `run` | pass-loop exit 10, engine exit 4 | `proposer_cap_exhausted` | The pass-loop script, lines 2318 to 2320; the engine script, lines 1949 to 1966 | read |
| `FX-20/cap-exhausted-structured` | `front-door` `run` | pass-loop exit 10, engine exit 4 | `proposer_cap_exhausted` | The pass-loop script, lines 2253 to 2255; the engine script, lines 1949 to 1966 | read |
| `FX-20/kill-note-carried` | `front-door` `run` | the hard cap is NOT exhausted: the first pass is killed by the watchdog and counted (1 of 3), its checkpoint is carried into the prompt of the next pass, that pass writes the evidence and the phase is approved; the engine exits 0 | none: the cap breaker does not fire | The pass-loop script, lines 2084 to 2088, and the note in the next pass's prompt at lines 1129 to 1141 | run |

**Scenarios added after the first set.** "Scenario of" names the feature that writes and keeps
the scenario: 141 for a scenario this feature delivers, another number for a scenario that the
feature added inside the scope of the family (rule 4 of §O.1, F141-FR-030). "Test of" names the
feature that owns the parity test.

| Family | Scenario | Scenario of | Test of | Stubs and verbs | Surfaces | Note |
|---|---|---|---|---|---|---|
| family FX-07 | `phase-not-found` | 141 | 101 | P `write` (the spec without the phase), `evidence`; CH is never called | Run set | The only scenario of the family that reaches engine exit 3 |
| family FX-07 | `critic-spec-missing` | 141 | 101 | none | `exit`, `stdout`, `stderr`, `state` | Drives the entry point `critic` |
| family FX-07 | `critic-format-invalid` | 141 | 101 | none | `exit`, `stdout`, `stderr`, `state` | Drives the entry point `critic` |
| family FX-07 | `critic-phase-not-found` | 141 | 101 | none | `exit`, `stdout`, `stderr`, `state` | Drives the entry point `critic` |
| family FX-07 | `critic-plan-invalid` | 141 | 101 | none | `exit`, `stdout`, `stderr`, `state` | Drives the entry point `critic` |
| family FX-07 | `critic-evidence-missing` | 141 | 101 | none | `exit`, `stdout`, `stderr`, `state` | Drives the entry point `critic` |
| family FX-18 | `unknown-harness-name` | 141 | 124 | none is called: no stub has the name | Run set | Asked by 124 (B-0575) |
| family FX-18 | `prime-empty-variant` | 141 | 138 | none is called | Run set | The proposer side of `FX-07/prime-empty-variant` |
| family FX-28 | `flag-without-value` | 141 | 119 | none | `exit`, `stdout`, `stderr` | Cited by 119 in F119-FR-005 as the capture of exit 127 |
| family FX-35 | `stale-sources` | 141 | 123 | E `succeed` | Run set, `pipeline`, `launcher` | Asked by 123. Exit 23 |
| family FX-35 | `invalid-launch-contract` | 141 | 123 | E is never called | Run set, `pipeline`, `launcher` | Asked by 123. Exit 20 |
| family FX-35 | `colour-always` | 141 | 123 | E `succeed` | `exit`, `stdout`, `stderr`, `pipeline` | Asked by 123. The colour mode is an argument of the command line; escape sequences are compared as written |
| family FX-35 | `colour-never` | 141 | 123 | E `succeed` | `exit`, `stdout`, `stderr`, `pipeline` | Asked by 123 |
| family FX-35 | `setup-without-implement` | 141 | 123 | E is never called | Run set, `pipeline` | Asked by 123. The stage reason `setup-required` |
| family FX-35 | `precondition-fails` | 141 | 123 | E is never called for the stage | Run set, `pipeline` | Asked by 123. The stage reason `stage-precondition` |
| family FX-36 | `observe-cadence` | 141 | 123 | E `sleep`, `succeed` | Run set, `pipeline` | Asked by 123 |
| family FX-38 | `invalid-allowlist-entry` | 141 | 130 | P `plugin-request`; I is never called | Run set | The member `allowlist-entry` of annex X §X.6 row 217. Baseline: the plugin request processor, line 38 |
| family FX-40 | `banner-width-full` | 141 | 145 | P, CH as in `FX-01/single-phase` | `exit`, `stdout`, `stderr` | A terminal of 80 columns |
| family FX-40 | `banner-width-compact` | 141 | 145 | P, CH | `exit`, `stdout`, `stderr` | A terminal of 60 columns |
| family FX-40 | `banner-width-line` | 141 | 145 | P, CH | `exit`, `stdout`, `stderr` | A terminal of 30 columns |
| family FX-40 | `banner-flags` | 141 | 145 | none | `exit`, `stdout`, `stderr` | Drives the banner: background, colour, no motion, preview, size |
| family FX-40 | `banner-motion-off` | 141 | 145 | none | `exit`, `stdout`, `stderr` | Drives the banner with the three variables that switch motion off |
| family FX-40 | `banner-switched-off` | 141 | 145 | none | `exit`, `stdout`, `stderr` | Drives the banner with the variables that switch the banner and the rail off, and with no phases and no states |
| family FX-40 | `colour-depth-16` | 141 | 145 | none | `exit`, `stdout`, `stderr` | Drives the banner and the presenter |
| family FX-40 | `colour-depth-256` | 141 | 145 | none | `exit`, `stdout`, `stderr` | As above |
| family FX-40 | `colour-depth-truecolor` | 141 | 145 | none | `exit`, `stdout`, `stderr` | As above |
| family FX-40 | `colour-forced` | 141 | 145 | none | `exit`, `stdout`, `stderr` | No terminal; colour forced by variable and by argument |
| family FX-40 | `colour-override` | 141 | 145 | none | `exit`, `stdout`, `stderr` | The variable that overrides the depth last |
| family FX-40 | `background-set` | 141 | 145 | none | `exit`, `stdout`, `stderr` | The background from a variable, in its two forms, and inside a terminal multiplexer |
| family FX-40 | `background-query` | 141 | 145 | none | `exit`, `stdout`, `stderr` | Drives the theme tool; the pseudo-terminal answers the query from the fixture, or does not answer |
| family FX-40 | `theme-usage` | 141 | 145 | none | `exit`, `stdout`, `stderr` | Drives the theme tool with an unknown argument: exit 1 |
| family FX-40 | `glyphs-ascii` | 141 | 145 | none | `exit`, `stdout`, `stderr` | The variable and the locale that force ASCII |
| family FX-40 | `timeline-events` | 141 | 145 | none | `exit`, `stdout`, `stderr` | Drives the presenter with an event file of the fixture that holds every event it renders |
| family FX-40 | `timeline-detail-milestones` | 141 | 145 | none | `exit`, `stdout`, `stderr` | As `timeline-events`, by flag and by variable |
| family FX-40 | `timeline-detail-full` | 141 | 145 | none | `exit`, `stdout`, `stderr` | As `timeline-events` |
| family FX-40 | `timeline-debug` | 141 | 145 | none | `exit`, `stdout`, `stderr` | Unknown events shown |
| family FX-40 | `timeline-no-terminal` | 141 | 145 | none | `exit`, `stdout`, `stderr` | The timeline without a terminal: lines and rails only |
| family FX-40 | `timeline-stop-requested` | 141 | 145 | P `sleep`; CH | `exit`, `stdout`, `stderr` | A stop request while the timeline follows |
| family FX-40 | `timeline-narrow` | 141 | 145 | none | `exit`, `stdout`, `stderr` | A terminal under 40 columns: the rail collapses |
| family FX-40 | `card` | 141 | 145 | none | `exit`, `stdout`, `stderr` | Drives `watch`; ended by an interrupt after the last event |
| family FX-40 | `card-stop-resume` | 141 | 145 | none | `exit`, `stdout`, `stderr` | An event file with a stop and a second start |
| family FX-01 | `codex-model-named` | 131 | 131 | P `evidence`; CH `approve` | Run set | In scope: the invocation of a harness |
| family FX-06 | `cli-timeout` | 109 | 109 | CC `hang` | Run set | In scope: a failed critic call on the CLI transport |
| family FX-06 | `codex-empty-choices` | 131 | 131 | CH `empty` with the argument `choices: none` | Run set | In scope. The argument is added in §O.3; no verb is added |
| family FX-25 | `codex-model-listed` | 131 | 131 | CH `approve` | `exit`, `stderr`, `state`, `events`, `transcript` | In scope: the context window of a harness |
| family FX-25 | `codex-model-unlisted` | 131 | 131 | CH `approve` | `exit`, `stderr`, `state`, `events`, `transcript` | In scope |
| family FX-26 | `registry-queries` | 109 | 109 | G `text` | `exit`, `stdout`, `stderr`, `state`, `events`, `transcript` | In scope: the route of a stream is read from the registry |
| family FX-26 | `root-sandbox-assertion` | 109 | 109 | P `text` | `exit`, `stdout`, `stderr`, `transcript` | In scope: the invocation of a harness. Prerequisite: the run has the effective user id 0; otherwise a skip with its reason |
| family FX-36 | `relaunch-budget-<n>` | 123 | 123 | E `transient` | Run set, `pipeline` | In scope. A pattern of 123: `<n>` is the relaunch count of its test. The members `relaunch-budget-exhausted` and `relaunch-budget-deadline-exceeded` of this feature cover the two refusals |
| family FX-39 | `invalid-scope-value` | 109 | 109 | none is called | Run set | In scope |
| family FX-39 | `scope-without-declaration` | 109 | 109 | P `evidence` | Run set | In scope |
| family FX-39 | `stale-overlay-swept` | 109 | 109 | P `evidence` | Run set | In scope. The stale tree is part of the template of the temporary directory |
| family FX-39 | `removal-fails` | 109 | 109 | P `evidence` | Run set | In scope |
| family FX-39 | `critic-overlay` | 109 | 109 | CC `approve` | Run set | In scope: the family names the entry point `critic` |
| family FX-39 | `executable-missing` | 109 | 109 | none is called | Run set | In scope |
| family FX-01 | `106-learning-suggest` | 106 | 106 | P `evidence`; CH `approve` | Run set | In scope: the core loop. The learning mode is a variable of the fixture; the decision log is a file of state in the template (F141-FR-012). Registered on 2026-09-30 under the name feature 106 gave it |
| family FX-01 | `106-learning-apply` | 106 | 106 | P `evidence`; CH `approve` | Run set | In scope, as `106-learning-suggest`, with the learning mode `apply` |
| family FX-01 | `106-learning-tampered` | 106 | 106 | P `write` with the argument `state` | Run set | In scope. A pass changes the decision log by its logical name; the argument is added in §O.3, no verb is added |
| family FX-29 | `106-apply-forced` | 106 | 106 | none | `exit`, `stdout`, `stderr`, `state`, `events` | In scope: the command `learn` with `--apply --force` over a quarantined value |
| family FX-29 | `106-evaluate-recorded` | 106 | 106 | none | `exit`, `stdout`, `stderr`, `state`, `events` | In scope: the evaluation that records an `evaluate` entry (`lib/learn.py evaluate` without `--dry-run`, which the `learn` mode of the entry point always passes). Registered by feature 106 to capture the member order of the entry |
| family FX-35 | `106-learning-exported` | 106 | 106 | E `succeed` | Run set, `pipeline` | In scope: a pipeline started with a learning mode exported in the shell. Runs as `@engine-stub` and as `@full-stack` |
| family FX-32 | `107-plan-with-other-fence` | 107 | 107 | none | `exit`, `stdout`, `stderr`, `tree`, `state` | In scope: derivation on a plan that holds a fence of another kind before a shell block (the reading of fences of the baseline, F107-FR-004). Registered on 2026-09-30 under the name feature 107 gave it |
| family FX-33 | `107-promote-unreadable` | 107 | 107 | none | `exit`, `stdout`, `stderr`, `state` | In scope: `contract-validate --promote` on a file that is not JSON; the baseline replaces it by a record with the status `draft` (F107-FR-021) |
| families FX-17, FX-18, FX-19, FX-20, FX-24 | `103-<name>` | 103 | 103 | the verbs of §O.3 | the surfaces of each family | Names that feature 103 reserves for the usage failures of the pass loop and the empty prompt. Not yet named; feature 103 registers each name here when it writes it |

**Requests that are not scenarios of a family.**

| Family | What was asked | Asked by | Why it is no scenario of the family |
|---|---|---|---|
| family FX-26 | `help-list-unavailable` | 109 | Outside the scope of FX-26, which is the stream formats and the invocation of a harness. The as-is line is printed only when the registry module of the reference cannot run; the reference tree is read-only (F141-FR-002) and no stub may take the name of the interpreter (§O.3, names). Feature 109 proves F109-FR-006 by a characterization test |
| family FX-18, family FX-23 | a limit signal declared by the generic stub | 127 | No stub emits a quota signal in a fixture of a family (F141-FR-043): the reference has no behaviour for it. In a characterization test the generic stub prints what its script gives it through `text` or `stream`; no verb is needed |

### §O.3 Stubs

Every stub obeys these rules (F141-FR-005):

| # | Rule |
|---|---|
| 1 | No clock and no randomness. The only state of a stub is an invocation counter kept outside the working directory |
| 2 | No model call, no credential read, no network connection other than to the loopback address |
| 3 | The same stub, unchanged, serves the reference and the port |
| 4 | Every invocation appends one record to the transcript (§O.4, `transcript`) |
| 5 | A scenario is data. It holds no nonce, no time and no path outside the fixture |

A script is a list of steps, one per invocation index of the stub. A step names one or more verbs.

**Proposer stub (P).** An executable named after the as-is command of the harness (§O.3, names).

| Verb | What it makes the stub do |
|---|---|
| `write` | Write or change files in the working directory, from the fixture; the spec included, where it lies in the working directory. With the argument `state: <logical name>`: write or change that file of state instead, at the path the oracle resolves for the side the stub runs on (F141-FR-012); the script holds the logical name and never a path |
| `evidence` | Write the phase evidence of the current phase, by a temporary name and a rename |
| `stream` | Print a recorded stream file of the fixture, in the format of the harness |
| `text` | Print plain text |
| `sleep` | Wait a number of watchdog ticks |
| `exit` | End with a given exit code |
| `yield` | Write a yield artifact from the fixture |
| `silent` | Print nothing and stay alive, for the idle watchdog |
| `repeat` | Print the same output again and again, for the repetition watchdog |
| `nothing` | Change no file, for the no-progress breaker |
| `plugin-request` | Write a plugin request file from the fixture |

The proposer stub has no verb that declares a unit of work. It never writes a checkpoint
(F141-FR-039).

**Critic stub (CH, CC) and diagnostician stub (D).** CH is one local server that answers in the
two request shapes the reference uses for a critic over HTTP. CC is an executable named after the
as-is command of a harness whose critic is a CLI. Both take the nonce from the prompt they
receive. Both serve the two forms of the `completion` level, tool-less and read-only tools; the
form changes nothing in the script. A call whose prompt holds no nonce is a call of the
diagnostician, and the stub answers it from the diagnostician part of the script.

| Verb | What it makes the stub do |
|---|---|
| `approve` | Reply with one approving verdict line that carries the nonce |
| `reject` | Reply with one rejecting verdict line and a text that names criterion or task ids of the fixture |
| `malformed-none` | Reply with no verdict line |
| `malformed-wrong-nonce` | Reply with a verdict line that carries another nonce |
| `malformed-duplicate` | Reply with two verdict lines |
| `empty` | Reply with nothing. With the argument `choices: none`, over HTTP in the second request shape: reply with an empty list of choices |
| `http-error` (CH), `exit` (CC) | Fail the call: a status code, or an exit code with text on a named stream |
| `hang` | Never reply |
| `hint` (D) | Reply with the hint text of the fixture |
| `fail` (D) | Fail the call |

**Engine stub (E).** An executable that stands in for the engine under the launcher, the pipeline
runtime and the supervisor.

| Verb | What it makes the stub do |
|---|---|
| `succeed` | End with exit 0 and leave the records of a finished run |
| `transient` | End with a given exit code and a given stop reason that is transient |
| `fail` | End with a given exit code and a given stop reason that is not transient |
| `stop` | End as a stopped run (exit 6) |
| `sleep` | Wait a number of ticks, for timeouts and signals |
| `crash` | End without writing a stop reason |

**Verification command stubs (V).** Small commands of the fixture.

| Verb | What it makes the stub do |
|---|---|
| `pass` | Exit 0 |
| `fail` | Fail at step n, with the output of the fixture |
| `slow` | Wait a number of ticks, then pass or fail |
| `write-result` | Write a result file, for pre-staged and detached commands |

**Plugin installer stub (I).** Answers the installer call of the dsh plugin request protocol. It
is the dsh stub called with the installer's arguments.

| Verb | What it makes the stub do |
|---|---|
| `install` | Exit 0 and write the profile entry of the fixture into the hermetic home |
| `fail` | Exit with a given code and text |
| `hang` | Never return, for the installer timeout |

**Telemetry sink stub (T).** One local server that accepts the payloads of the shippers and
stores them. Verbs: `accept`, `refuse` with a status code, `down`.

**Harness stubs.** A harness stub is the proposer stub, the critic stub or both under the name
and the calling convention of one harness.

| Harness | Roles | What a script can make it do, beyond the verbs above | What it records |
|---|---|---|---|
| Claude | Proposer (P); critic (CH) | Replay a stream in the Claude stream format; end without a terminal record | The argument list, the prompt, the names of environment variables |
| dsh | Proposer (P); critic (CC); installer (I) | Print final text only on standard output; print an error line on standard error or on standard output and exit 1; answer the installer call | The argument list with the prompt as one positional argument, or in chunks for the critic; the content of the settings file of the home it was given; the content of the patch file it was given; the permission mode it saw |
| Codex | Proposer (P); critic (CH) | Print raw text; answer the critic call in the second request shape | The argument list with the prompt as a positional argument; for the critic the request body without the key |
| prime | Proposer (P); critic (CC) | Replay a stream in schema version 3, or print text, depending on the mode it is called in; report a provider error in the stream and exit 0; answer under the name of the launcher and under the name of the agent | The argument list, the mode, the variant, the prompt from standard input |
| pi | Proposer (P); critic (CC) | Replay a stream in the pi dialect; print text | The argument list, the prompt. **Port side only**: pi has no as-is behaviour, so no fixture family names this stub (§O.7) |
| Generic (G) | Proposer; critic | Whatever a harness descriptor of the fixture declares: text or a declared stream format, prompt by standard input or by argument | The argument list, the prompt |

**Names of stub executables.** A stub executable has the name of the as-is command of a harness
with as-is behaviour (the commands of Claude, dsh, Codex and prime, and the launcher of prime), the
name of the as-is engine command, or the one generic name `stub-harness` for a descriptor-driven
harness. The harnesses named here are those that have as-is behaviour or a Wave 1 harness adapter;
the list is not a list of the harnesses the product supports, which is the registry. The locally
registered backend of the baseline has no stub name (§O.7).

### §O.4 Compared surfaces

| Id | Name to cite | Content | Rules applied |
|---|---|---|---|
| S-01 | `exit` | The exit code of the driven command | The exit-code map of `resume` where it applies |
| S-02 | `stdout` | Standard output as bytes | N-01 to N-08, N-15, N-18 to N-21 |
| S-03 | `stderr` | Standard error as bytes, apart from `stdout` | As `stdout` |
| S-04 | `tree` | The working directory after the run, without state: path, type, mode, link target, content | N-01, N-08, N-23, N-25 |
| S-05 | `state` | The files of state, by logical name: existence and content | N-02, and the rules of `tree`; N-09 to N-11, N-16; N-29 for the source inventory of a reverse run |
| S-06 | `events` | Every event file. On the port side the compatibility projection | N-12, N-13, N-14, N-03, N-04, N-05, N-07 |
| S-07 | `transcript` | The records of every stub: role, call index, argument list, names of environment variables (never values), prompt. In a form neutral to the transport of the critic. Citable per role: `transcript.proposer`, `transcript.critic`, `transcript.diagnostician`, `transcript.engine`, `transcript.verification`, `transcript.installer` | N-23, N-24, N-01 to N-08; the argument table of the harness adapter |
| S-08 | `processes` | The processes the run left behind | N-07 |
| S-09 | `pipeline` | For the pipeline: the state record, the launch record of the supervisor and the three logs | N-02, N-04, N-05, N-07, N-16, N-19, N-20 |
| S-10 | `telemetry` | The payloads at the telemetry sink stub | N-26 |
| S-11 | `repository` | The commits of the project's repository: message, tree content, the absence of a push | N-22 |
| S-12 | `launcher` | The launcher and the launch bundle as a logical record | N-17, N-10, N-11 |
| S-13 | `home` | The hermetic home and the temporary directory after the run: path, type, link target, content | N-01, N-08 |
| S-14 | `events-primary` | The primary event file of the port. **Second suite only** | N-03, N-04, N-05, N-07 |
| S-15 | `control-records` | The records of the control plane of the port, by logical name. **Second suite only** | N-02 and the rules of `state` |
| S-16 | `counters` | Per phase: passes used, reject count, MALFORMED streak, numbers of phase attempts, yield count. **Second suite only**; asserted equal, not compared as text | none |

A parity test cites surfaces by name. A test that cites no surface is refused.

### §O.5 Results, normalization rules and waivers

Per fixture and per surface the comparator gives exactly one result:

| Result | Meaning |
|---|---|
| `equal` | After normalization the two captures are the same |
| `waived (<register row>)` | The captures differ, and every difference is matched by a waiver keyed to the named row of the divergence register |
| `different` | Anything else, including a capture that could not be made or read |

| # | Rule |
|---|---|
| 1 | A release is blocked on any `different` |
| 2 | A normalization rule that replaces nothing in any fixture fails the suite |
| 3 | A waiver that matches no difference fails the suite |
| 4 | A normalization rule is added only with a row of the divergence register, or with a statement that the value is not deterministic in the reference itself; it is added in feature 100 |
| 5 | A waiver is added only with a row of the divergence register whose oracle handling says "waiver" |
| 6 | No rule and no waiver hides a line that exists only in the port (DV-034) |
| 7 | The comparator reports, per fixture, how many values each rule replaced |

### §O.6 Naming and declarations of tests

| Kind | Name | Proves |
|---|---|---|
| Parity test of an as-is requirement or success criterion | `PT-<feature>-<origin>-<slug>`, the origin without spaces and hyphens: `PT-104-028FR001-detection-order` | One or more as-is ids |
| Parity test of a cluster of behaviour items | `PT-<feature>-<cluster>-<slug>`: `PT-130-C-040-request-schema` | Items of the cluster that the traceability files assign to the feature |
| Characterization test | `CT-<feature>-<n>`: `CT-134-3` | A kept Lisa behaviour, a fixed defect, a behaviour with no reference, or a new requirement |

`<feature>` is the three-digit number of the feature that owns the test. `<slug>` is lower case
with hyphens.

A parity test declares, in its task of `tasks.md` and in the test itself:

| Field | Content | Rule |
|---|---|---|
| `proves:` | Full ids separated by `;`: `028 FR-005`, `011 SC-003`, `C-101`, `B-0042` | Every id exists and is assigned to the feature of the test with a kept disposition |
| `fixture:` | Family ids separated by `,`; optionally `FX-nn/<scenario>`; for FX-35 and FX-36 optionally `@engine-stub` or `@full-stack` | Every family is in the catalogue and is not retired. A scenario is one the catalogue holds, of this feature or of another. A pattern name stands for all its members |
| `surfaces:` | Names of §O.4 separated by `,` | Every name exists and belongs to the surfaces of the family |

`surfaces:` is required in the test and in the fixture declaration. In a task of `tasks.md` it
may be left out; the test then compares every surface of the family.

A characterization test declares `proves:`. It declares no `fixture:` unless it uses the stubs of
the oracle, and it is never counted as a parity test.

### §O.7 Behaviour with no reference

| Subject | Parity test? | What it has instead |
|---|---|---|
| A harness the product has no tested harness adapter for | None. The reference has no behaviour for it | The conformance suite of the harness port (EP-02), run with the generic stub `stub-harness` and a harness descriptor of the fixture; the scenarios `harness-generic` of FX-01 and `generic-text` of FX-26 prove that the reference and the port treat a harness that is only declared in the same way, which is a parity test of the registry and not of the harness |
| pi | None. pi has no as-is behaviour and no reference | Characterization tests `CT-134-<n>` of feature 134, and the conformance suite of the harness port with the pi stub of §O.3 and recorded streams that feature 134 owns |
| Kept Lisa behaviour | None. Lisa has no reference run in the oracle | Characterization tests in the feature that keeps the behaviour |
| A fixed defect, and a behaviour that is new | None for the new behaviour | A characterization test of the new behaviour; the as-is side is a waiver, a mapping or a switch, as its register row says |
| The locally registered backend of the baseline | None | Nothing. Its behaviour items are `superseded-by DV-064`. No fixture names it, no stub carries its name, and the as-is assets of the baseline that belong to it are not imported. A consumer who has such a harness declares it in the registry, where the first row of this table applies |
| A behaviour item that no fixture can execute | None | A characterization test or a register row, by a correction of the traceability files (F141-FR-033) |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The author of a feature cites the oracle (Priority: P1)

The author of one of the other specifications of Wave 1 (thirty when this was written, forty
after the splits) writes a parity test for each as-is behaviour the feature carries. The author needs the family, the scenario, the stub verbs and the
surfaces from one place, stated so exactly that two authors cannot read them in two ways.

**Why this priority**: The other specifications are written in parallel. A gap here is filled
once per specification, each time differently.

**Independent Test**: Take any kept row of the traceability files. From §O.2 to §O.6 alone, write
the declaration of its parity test; the declaration check accepts it.

**Acceptance Scenarios**:

1. **Given** a kept row that names a fixture family, **When** the author looks the family up, **Then** the catalogue gives its scope, the reference and entry point it runs, its stubs, its surfaces and the features it covers (F141-FR-013).
2. **Given** a test that names a family outside the catalogue, a retired family, a surface outside §O.4 or an id that does not exist, **When** the declaration check runs, **Then** it fails and names the test (F141-FR-027, F141-FR-034).
3. **Given** a feature that needs a scenario its family lacks, **When** the scenario stays inside the scope of the family and uses only verbs and surfaces of this specification, **Then** the feature adds it; otherwise it reports the need (F141-FR-030).
4. **Given** pi, or a harness without a tested harness adapter, **When** the author looks for its parity test, **Then** §O.7 says that there is none and names what proves the behaviour instead (F141-FR-028).

---

### User Story 2 - A developer compares the port with the reference (Priority: P1)

A developer changes the product and runs a fixture. The oracle runs the reference and the port in
the same empty environment with the same stubs and says, per surface, `equal`, `waived` with its
register row, or `different`.

**Why this priority**: It is the differential test that decision 4 asks for. Everything else in
this feature serves it.

**Independent Test**: Run FX-01 `three-phases` with the reference on both sides: every surface is
`equal`. Seed one changed byte in one surface: that surface is `different`.

**Acceptance Scenarios**:

1. **Given** the two source repositories in any state, **When** the reference trees are produced, **Then** each equals the pinned tree hash, is read-only, and no file, branch, index or configuration of a source repository has changed (F141-FR-002).
2. **Given** a fixture, **When** it runs twice on the same side, **Then** the two normalized captures are the same (F141-FR-044).
3. **Given** a machine with harnesses installed and logged in, **When** a fixture runs, **Then** the stubs are called, no installed harness is called, and no connection leaves the machine (F141-FR-003, F141-FR-038).
4. **Given** a difference that a waiver matches, **When** the comparator runs, **Then** the result is `waived` with the register row; **Given** a waiver that matches nothing, **Then** the suite fails (F141-FR-022).
5. **Given** a line on a compared stream that only the port prints, **When** the comparator runs, **Then** the result is `different` (F141-FR-024).

---

### User Story 3 - The release is held until every parity test passes (Priority: P1)

Whoever cuts a release learns from one run whether the release may go out. The run covers every
parity test of every feature, the fixtures of dsh, Codex and prime included, the second suite, and
a macOS runner.

**Why this priority**: The owner ruled it (rulings 32 and 67).

**Independent Test**: With one fixture surface made `different`, one test skipped, or no macOS
result, the release check reports "blocked" and names the cause.

**Acceptance Scenarios**:

1. **Given** a release candidate, **When** any fixture surface reads `different`, **Then** the release is blocked (F141-FR-026).
2. **Given** a release candidate, **When** the live differential run on Linux has not run on this build, or a committed golden capture differs from a fresh capture, **Then** the release is blocked (F141-FR-025).
3. **Given** a release candidate, **When** no macOS runner has passed the oracle on this build, **Then** the release is blocked and every statement about macOS stays `unverified` (F141-FR-036).
4. **Given** a fixture whose prerequisite is missing, **When** the suite runs, **Then** the fixture is reported as a skip with its reason and never as a pass; at the release check a skip blocks (F141-FR-037).

---

### User Story 4 - A reviewer checks what a test claims (Priority: P2)

A reviewer of the cross-feature review wants to know that a test which says it proves a behaviour
item does prove it.

**Why this priority**: Fixture families were assigned by subject. Without a check, "the fixture
covers the item" is an assertion.

**Independent Test**: Give the claim check a test whose fixture did not execute the evidence line
of an item it claims: the check fails and names the test and the item.

**Acceptance Scenarios**:

1. **Given** the reference run of a fixture with line tracing, **When** the exercise map is written, **Then** it holds every file and line of the reference that the fixture executed (F141-FR-031).
2. **Given** a kept row of the traceability files that no test names, **When** the coverage script runs, **Then** it fails and names the row (F141-FR-034).
3. **Given** a behaviour item that no fixture executes, **When** the report is written, **Then** the item is listed with the families that were tried, as a correction for the orchestrator (F141-FR-033).

---

### User Story 5 - The owner of the micro-loop layer proves that it is inert (Priority: P2)

With the micro-loop layer on and a proposer that never declares a unit of work, a run must be the
same as with the layer off, apart from the fields the register names.

**Why this priority**: The layer is on by default in the product. Its inertness is the clause of
decision 21 that lets the parity suite speak for the default configuration.

**Independent Test**: Run the second suite on a build in which the layer changes one counter or
writes one unnamed field: the suite fails and reports a possible breach of gate integrity.

**Acceptance Scenarios**:

1. **Given** every fixture of the first suite, **When** the second suite runs, **Then** each runs unchanged on the port with row 1 of the `parity` profile set to `micro` and nothing else changed (F141-FR-039).
2. **Given** the two captures of the port, **When** they are compared, **Then** only the surfaces of the layer allowlist are removed, and any other difference fails the suite (F141-FR-040).
3. **Given** the two captures, **When** the counters are read, **Then** they are equal for every phase (F141-FR-041).
4. **Given** an allowlist entry that matches nothing in any fixture, **When** the suite ends, **Then** it fails (F141-FR-040).

---

### User Story 6 - The author of a harness adapter gets scenarios for dsh, Codex and prime (Priority: P2)

The authors of features 130, 131 and 138 carry 136 behaviour items that are release conditions.
They need scenarios that drive the as-is invocation, stream and critic behaviour of each harness,
and the dsh plugin request protocol, without any live harness.

**Why this priority**: Ruling 32 moved these items into Wave 1. No fixture for them existed.

**Independent Test**: On a machine with none of the three harnesses installed, every scenario of
§O.2 that names one of them runs on the reference and gives a capture.

**Acceptance Scenarios**:

1. **Given** a scenario that names dsh, Codex or prime, **When** it runs, **Then** the reference calls a stub named after the as-is command, and the transcript shows the argument list, the prompt and the names of the variables (F141-FR-015, F141-FR-011).
2. **Given** the scenario `installed-then-restart` of FX-38, **When** it runs, **Then** the installer stub is called with the as-is arguments, a receipt is written, and the next pass starts (F141-FR-014).
3. **Given** a fact of a harness that research left `unverified`, **When** a scenario is written, **Then** the scenario does not encode it (F141-FR-015).

---

### Edge Cases

- The checkout of a source repository is on another branch and has uncommitted changes: only the pinned commit counts; the working tree of the source repository is neither read nor changed (F141-FR-002).
- The reference writes into its own tree during a run: the run fails, because the tree is read-only and is checked after every run (F141-FR-002).
- The reference lists the entries of its registry in a message, and one entry is the locally registered backend: the name is never stored and never compared (F141-FR-029).
- A reference event line holds the same key twice, or a number as text: it is compared as it is (N-13).
- Two critic calls carry the same nonce: the comparator fails before it normalizes (F141-FR-021).
- A stub is called more often than its script has steps: the stub fails the call with a fixed exit code and the transcript records it; the surface reads `different` unless both sides did the same.
- The reference cannot run on the host (no bash 4, no `flock`): a skip with its reason on a development machine; the port is compared with the committed Linux capture (F141-FR-035, F141-FR-037).
- A fixture family is retired: its id is kept, it has no scenario, and a test that cites it is refused (F141-FR-013).
- A register row changes its oracle handling: the register map of the oracle no longer agrees, and the suite fails until the map follows (F141-FR-023).
- A fixture leaves a process behind on one side only: the surface `processes` reads `different`, and the oracle ends the process before the next fixture.

## Requirements *(mandatory)*

### Functional Requirements

#### G1 — Reference, environment, stubs, transcripts

- **F141-FR-001**: The oracle MUST hold one pin per reference system: the full commit id and the tree hash. The pins are `9cab15d2d08f6c54644985f7251700bbdbcab282` with tree `d58ea3b50f67a6cdfb387b1d86e5d145ac923880` for Specstride, and `9c88f86e1771efeabcfe3b4b1cb24384fff284e8` with tree `a7473137805cded899ee0077b7879c70a05f4451` for mixture-of-loops. Only the pinned commit counts: the branch that a source repository has checked out and any uncommitted change in it MUST have no effect on the reference. Lisa MUST have no pin and no reference run.
  - test: CT-141-101

- **F141-FR-002**: The oracle MUST obtain each reference tree by an archive of the pinned commit, unpacked into a scratch directory outside every source repository, or from a release archive whose hash is pinned. It MUST verify the tree against the pinned tree hash, MUST make the tree read-only, and MUST check after every run that the tree is unchanged; a changed tree fails the run. It MUST run no command that writes to a source repository: no checkout, no branch, no worktree, no stash, no change of index or configuration. The reference MUST run without writing caches of its interpreter into its tree. The reference tree holds no install-root `.env`; a fixture that tests that layer MUST use a copy of the tree with its own file. A fixture MUST NOT change the reference tree, shadow the interpreter, or make a file of the reference missing or unwritable to reach a line that runs only in that case; an item that only such a line carries is reported in the correction list (F141-FR-033).
  - divergence: DV-023
  - test: CT-141-102
  - assumption: CQ-193 (no fixture may change the reference tree or shadow the interpreter to reach a line; the correction list holds what no fixture reaches)

- **F141-FR-003**: Every run, of the reference and of the port, MUST start from an empty environment to which only an allow-list is added: a search path on which the stub directory of the fixture stands before every system directory; a fresh home, temporary directory and configuration, state and cache directories per run; the time zone UTC and one fixed locale; colour off; the two tick variables of the reference set to 1; the telemetry state directory under the temporary directory of the run; an empty global and system configuration of the version-control tool with a fixed identity and fixed dates; the address of the critic stub and a dummy key; and the variables the fixture declares. No other variable of the machine MUST reach a run. The port MUST be driven by the same variables, through the environment alias table of feature 100, annex X §X.8.
  - test: CT-141-103

- **F141-FR-004**: The oracle MUST run the port under the named profile `parity` of feature 100, annex X §X.7, selected by ordinary configuration, and MUST set nothing that the profile or the fixture does not name. Where a fixture needs the engine stub, the oracle MUST name it through the switch of row 41 of the profile and through the search path. The oracle MUST fail when the product offers a switch, a variable or a code path that exists for the oracle alone.
  - test: CT-141-104

- **F141-FR-005**: Every stub MUST obey the five rules of §O.3: no clock and no randomness, with an invocation counter outside the working directory as its only state; no model call, no credential read and no connection other than to the loopback address; the same stub unchanged for the reference and the port; one transcript record per invocation; scenarios that are data and hold no nonce, no time and no path outside the fixture. A stub that is called beyond the last step of its script MUST fail the call with one fixed exit code and record it.
  - test: CT-141-105

- **F141-FR-006**: Stub executables MUST be named as §O.3 says: after the as-is command of a harness with as-is behaviour, after the as-is engine command, or `stub-harness` for a descriptor-driven harness. The set of names MUST be data of the fixture catalogue and MUST NOT be read as a list of supported harnesses; a fixture that enumerates harnesses MUST read the registry of the side it runs.
  - divergence: DV-064
  - test: CT-141-106

- **F141-FR-007**: The proposer stub MUST offer exactly the verbs of the proposer table of §O.3, scripted per invocation index. It MUST offer no verb that declares a unit of work or writes a checkpoint.
  - test: CT-141-107

- **F141-FR-008**: The critic stub MUST exist over HTTP, in the two request shapes the reference uses, and as a CLI, and MUST offer exactly the verbs of the critic table of §O.3. It MUST take the nonce from the prompt it receives. It MUST serve both forms of the `completion` level with the same script. A call whose prompt holds no nonce MUST be answered as a call of the diagnostician, with the verbs `hint` and `fail`.
  - divergence: DV-001; DV-081
  - test: CT-141-108

- **F141-FR-009**: The oracle MUST offer the engine stub, the verification command stubs, the plugin installer stub and the telemetry sink stub, each with exactly the verbs of its table of §O.3. The engine stub MUST leave the exit code and the stop reason that its script names, in the form the reference and the port each read.
  - test: CT-141-109

- **F141-FR-010**: The oracle MUST offer the harness stubs of §O.3 for Claude, dsh, Codex, prime and pi, and the generic stub. Each MUST follow the calling convention of its harness as the table states it and MUST record what the table states. The pi stub MUST be used on the port side only. A further harness stub MUST be added by data: a name, a calling convention and a stream format, with no change to the comparator or the normalizer.
  - ep: EP-02 `specstride.harness/1`, `descriptorVersion: 1` (consumes)
  - test: CT-141-110

- **F141-FR-011**: Every stub MUST append one record per invocation to a transcript outside the working directory: the role, the call index, the argument list, the names of the environment variables it saw and never their values, and the prompt. The transcript MUST be a compared surface. It MUST be compared in a form that is neutral to the transport of the critic, so that a critic reached over HTTP on one side and as a CLI on the other gives the same record for the same prompt. From the transcripts the comparator MUST assert that no invocation carried an argument that continues a session.
  - divergence: DV-001; DV-010; DV-030; DV-031
  - test: CT-141-111

#### G2 — Fixtures, surfaces, normalizer, comparator, waivers

- **F141-FR-012**: A fixture MUST be a declaration and its files: the id `FX-nn/<scenario>`, the reference system and entry point, the command line, the declared variables, the script of every stub, the template of the working directory, the expected exit code, the `surfaces` it compares, its `proves` list, the operating systems it runs on, any duration it declares as the behaviour under test, and any waiver it relies on. A fixture whose declaration lacks a field MUST be refused before it runs. A template MAY hold files of state; the oracle MUST lay each of them out per side by its logical name, at the as-is path on the reference and, on the port, at the path that the layout tables of feature 100 give that name, and a fixture MUST hold no physical path of the port's state. State that the port does not read in the as-is form MUST come from steps of the scenario that each side runs itself. The as-is fixture files of the baselines that a scenario uses (input streams, the two greeting projects, the reverse sources, the learning events) MUST be imported as assets of the oracle, unchanged, each with the licence notice of its baseline; the as-is assets of the locally registered backend are not imported. The source inventory of a reverse run among the reverse sources is compared under the row DV-116 of the register, whose oracle handling this feature confirms: the field `schema` that the port's inventory carries (`specstride.reverse-inventory/1`) is removed by the normalization rule N-29 of feature 100, annex X §X.8, before the inventory is compared on FX-30.
  - divergence: DV-116
  - test: CT-141-112
  - assumption: CQ-030 (as-is assets under the licence of the baseline inside a repository under the MIT licence)

- **F141-FR-013**: The catalogue of fixture families MUST be the table of §O.2. For each family it MUST give the id, the name, what the family exercises, the reference and entry point, the stubs, the surfaces and the features covered. An id MUST never be reused or renamed. FX-37 MUST be retired: it keeps its id, has no scenario, and a test that cites it MUST be refused. For every scenario of a critic family and of a harness family (FX-06, FX-07, FX-17 to FX-20) that this feature delivers the catalogue MUST state how the driven command ends on the reference: the exit code of the entry point, the stop reason, the evidence line of the baseline, and whether the end was run or read. The stated end is a record of the reference and no expectation of its own: a capture of the reference that differs from it MUST fail the capture job until the catalogue is corrected.
  - divergence: DV-056
  - test: CT-141-113; CT-141-146

- **F141-FR-014**: The oracle MUST add the families FX-38, FX-39 and FX-40 of §O.2, each answering the reservation of `traceability.md` section 5 that the catalogue names. FX-38 MUST cover the 27 items of the dsh plugin request protocol with a request file written by the proposer stub and the plugin installer stub. FX-39 MUST declare an overlay of the configuration home through the as-is variable of the harness. FX-40 MUST run the front door on a pseudo-terminal, and MUST drive the presenter, the banner and the theme tool where the front door does not reach a behaviour. A further family MUST be opened only when the exercise map shows that no scenario inside an existing family can execute an item, and MUST continue the numbering.
  - test: CT-141-114; CT-141-148

- **F141-FR-015**: The oracle MUST hold scenarios for the as-is behaviour of dsh, Codex and prime: their proposer invocations and streams in FX-01 and FX-26, their critic calls in FX-01 and FX-06, the errors of their critic configuration in FX-07, each with the end that the code of the baseline gives it, a pass that fails before the harness starts in FX-18, their context windows in FX-25, the plugin protocol in FX-38 and the settings overlay of dsh in FX-39. The reference side MUST need nothing but stub executables. No scenario MUST depend on an installed harness. No scenario MUST encode a fact that research left `unverified`: what the approval mode of dsh does in a headless run, and the structured quota event of Codex.
  - divergence: DV-064; DV-117
  - test: CT-141-115
  - assumption: CQ-187 (a missing critic credential is scored as a failed critic call under the `parity` profile, as the baseline does; `FX-07/missing-key` and `FX-07/codex-missing-key` compare with the switch of DV-117 off)
  - status: unverified (check: the harness adapter features 130 and 131 capture the two facts before their specifications freeze; verified-on: —; pin: the harness versions of R9 and R6)

- **F141-FR-016**: Every scenario of FX-35 and FX-36 MUST run twice: as `@engine-stub`, against the engine stub, which isolates the launcher, the pipeline runtime and the supervisor; and as `@full-stack`, against the real engine with agent stubs.
  - divergence: DV-028; DV-074
  - test: CT-141-116

- **F141-FR-017**: Before the scenarios `consecutive-errors-structured` of FX-18 and `cap-exhausted-structured` of FX-20 are written, the oracle MUST hold two supplementary rows of the behaviour inventory for the write sites of the stop-reason line on the structured path of the pass loop of the Specstride baseline: the site that writes `proposer_cap_exhausted` (line 2253 of the pass-loop script at `9cab15d`) and the site that writes `proposer_consecutive_errors` (line 2259). Each row MUST carry the fields of an inventory row. The exercise map MUST treat them as items. The rows are proposed to the orchestrator for the inventory and the traceability files, which this feature does not write.
  - test: CT-141-117

- **F141-FR-018**: The two as-is fixtures of mixture-of-loops, `greeting-ready` and `greeting-blocked`, with their expectations, MUST become scenarios of FX-32, and the port MUST give the expected result of each through the comparison with the reference.
  - origin: 011 SC-008
  - disposition: translated
  - test: PT-141-011SC008-*
  - divergence: DV-060

- **F141-FR-019**: The oracle MUST capture, per run, the surfaces S-01 to S-13 of §O.4 that the fixture names, and on the port also S-14 to S-16. Standard output and standard error MUST be captured apart, as bytes. State MUST be captured by logical name through the layout tables of feature 100. A capture MUST be taken after the run has ended and after the processes it left behind were listed.
  - ep: EP-08 `specstride.event-sink/1` (consumes)
  - divergence: DV-006; DV-072
  - test: CT-141-119

- **F141-FR-020**: The normalizer MUST implement the rules N-01 to N-29 of feature 100, annex X §X.8, and no other rule. It MUST read the layout tables, the environment alias table, the component-name table and the further maps from the data of feature 100 and MUST hold no table of its own. It MUST report, per fixture, how many values each rule replaced. A rule that replaces nothing in any fixture MUST fail the suite. A rule that marks a subject as not compared (N-25, N-28) counts what it left out. A rule that replaces no value by its own text, because it asserts, reads or compares as written (N-09, N-12 to N-14, N-19 to N-21, N-24 and N-27 among them), counts the values it was applied to; "replaces nothing" means a count of 0.
  - test: CT-141-120

- **F141-FR-021**: The comparator MUST give, per fixture and surface, exactly one of `equal`, `waived (<register row>)` and `different`, as §O.5 defines them. A capture that is missing or unreadable MUST give `different`. Before it normalizes, the comparator MUST assert what normalization would hide: the form of every nonce and that no two critic calls share one; that time values do not decrease where the reference's do not; that a hash of the path class is right for its own input; that a hash of the implementation class is consistent with what it covers. A failed assertion MUST give `different`.
  - test: CT-141-121

- **F141-FR-022**: Waivers MUST live in one file, each keyed by fixture, surface and register row, and each naming the difference it accepts. A waiver MUST be accepted only when its register row exists and its oracle handling says "waiver". A waiver that matches no difference MUST fail the suite. A waiver MUST never accept a difference in another fixture or surface than its own. The waivers of Wave 1 are those marked in the scenario table of §O.2, for the rows DV-004, DV-009, DV-022, DV-024, DV-029, DV-032, DV-058, DV-060, DV-073, DV-075, DV-107 and DV-112; a waiver for DV-112 is written only for a scenario in which the prime stub is called; a waiver for DV-023 is written only together with a fixture that tests that layer.
  - test: CT-141-122

- **F141-FR-023**: The oracle MUST hold a register map with one entry for every row of the divergence register (DV-001 to DV-119 on 2026-09-30) that gives the handling of the row in the oracle: a normalization rule, a switch of the `parity` profile that is off, a mapping table, a waiver, a layer field, not observable, none needed, or no differential test. The suite MUST fail when a register row has no entry, when an entry names a rule, a switch, a table or a waiver that does not exist, or when an entry disagrees with the column "Oracle handling" of the register. The mapping tables are those of feature 100: the mode map, the exit-code map of `resume`, the key-name map of the launch contract, and the argument table of each harness adapter, which the harness adapter owns.
  - divergence: DV-009; DV-021; DV-027; DV-031; DV-055
  - test: CT-141-123

- **F141-FR-024**: A line on a compared stream of the port that has no equivalent on the reference MUST give `different`. No normalization rule and no waiver MUST remove such a line. The first suite MUST compare the port in compatibility output.
  - divergence: DV-034; DV-033
  - test: CT-141-124

- **F141-FR-025**: The oracle MUST support two ways of comparing. For a change under review, the port MUST be compared with committed golden captures of the reference, so that the reference need not run. As the release condition, the reference MUST run live on Linux and be compared with the port on the same build. A capture job MUST fail when a committed golden capture differs from a fresh capture of the reference. A golden capture MUST be stored in normalized form and MUST hold no path, account or name of the machine that made it. The repository of the product MUST hold no copy of a reference tree. On macOS, where the Specstride reference does not run, the release condition MUST use the golden captures that the live run on Linux confirmed on the same build.
  - test: CT-141-125

- **F141-FR-026**: A release MUST be blocked while any fixture surface reads `different`, while any self-check of the oracle fails, while any parity test of any feature fails or is skipped, while the second suite fails, or while the live differential run has not passed on the build to be released. The fixtures of dsh, Codex and prime MUST be inside this condition. No behaviour item MUST be left out because its harness was planned for a later wave.
  - test: CT-141-126

- **F141-FR-027**: Parity tests and characterization tests MUST be named and MUST declare `proves:`, `fixture:` and `surfaces:` as §O.6 says. The oracle MUST refuse to run a parity test whose declaration names a family outside the catalogue, a retired family, a scenario that the catalogue does not hold, or a surface outside §O.4 or outside the surfaces of the family.
  - test: CT-141-127

- **F141-FR-028**: For a harness without a tested harness adapter, for pi and for kept Lisa behaviour there MUST be no parity test, and the oracle MUST offer what §O.7 names in its place: the generic stub and the pi stub for conformance suites and characterization tests, and the scenarios `harness-generic` and `generic-text`. A test that declares itself a parity test of such a behaviour MUST be refused.
  - test: CT-141-128

- **F141-FR-029**: The oracle MUST treat the locally registered backend of the baseline as §O.7 says: no fixture, no stub name, no imported asset. Where an output of the reference lists the entries of its registry, the entry that the port does not carry MUST be handled before anything is stored or compared, so that its name appears in no golden capture, report or log of the oracle. The oracle MUST find that entry at run time, as the entries of the reference registry minus the entries with as-is behaviour that the product carries, and MUST NOT hold its name in any file. A check MUST fail when a name found in this way appears in a file of the oracle.
  - divergence: DV-064
  - test: CT-141-129
  - assumption: CQ-029 (the register assigns unknown-name messages to N-15; feature 100 has no row of the component-name table for a registry entry that is not carried)

- **F141-FR-030**: The oracle MUST deliver the scenarios of the scenario table of §O.2 and the members of its pattern names. A feature MAY add a scenario to a family in its own tasks when the scenario stays inside the scope the catalogue states for the family and uses only stub verbs of §O.3 and surfaces of §O.4. The oracle MUST refuse a scenario that uses an unknown verb or surface. The catalogue MUST be the register of scenario names: it MUST hold every scenario with the feature that owns it, and every pattern name with its members and the closed set they come from. Two scenarios of one family MUST NOT share a name. A scenario that a feature adds and that the catalogue does not hold yet carries the number of the feature in its name; once the catalogue holds it, the name it has there stands.
  - test: CT-141-130; CT-141-147
  - assumption: CQ-027 (who writes a scenario that the first set lacks); CQ-194 (the error classes of FX-33 are the ten validators of the baseline, the closed set of annex X §X.6 row 274, owner 107)

#### G3 — Exercise map, coverage script, per-OS expectations

- **F141-FR-031**: The capture job MUST run the reference with line tracing and MUST record, per fixture, which file and line of the reference each scenario executed: the exercise map. The map MUST cover the shell parts and the Python parts of both baselines. Tracing MUST NOT change any compared surface; a capture made with tracing MUST equal one made without.
  - test: CT-141-131
  - status: unverified (check: run the tracing of the Python parts on the reference; the shell half was probed by R18 F-22; verified-on: —; pin: the baseline commits)

- **F141-FR-032**: A test MUST be allowed to claim a behaviour item only if a fixture it names executed the evidence line of that item. A claim of a cluster MUST hold when every item of the cluster that the traceability files assign to the feature of the test with a kept disposition was executed by a fixture of a test of that feature that claims the cluster. The claim check MUST fail and name the test and the item otherwise.
  - test: CT-141-132

- **F141-FR-033**: The oracle MUST report every behaviour item with a kept disposition that no fixture executed, with the families that the traceability files name for it, and every item whose named family did not execute it while another family did. The report is the correction list for the orchestrator. An item that no fixture can execute MUST be proposed for a characterization test or a register row. The oracle MUST never write the traceability files.
  - test: CT-141-133
  - assumption: CQ-193 (a line of the reference that runs only when a file of the reference is missing or cannot be written is reached by no fixture and goes to the correction list)

- **F141-FR-034**: The coverage script of the cross-feature review MUST check that every row of the traceability files with a kept disposition is named by the `proves:` of at least one test of its feature; that every id a test or an `origin:` names exists; that every `fixture:` names a family of the catalogue that is not retired; and, where an exercise map exists, that every claim passes F141-FR-032. It MUST be kept with the traceability files and MUST exit with a failure when a check fails.
  - test: CT-141-134

- **F141-FR-035**: The Specstride reference MUST be authoritative on Linux only. On macOS the port MUST be compared with the Linux capture of the reference and with the per-OS expectations: the form of the lock differs and the refusal of a second engine start is compared; a detached job is compared by behaviour; the temporary directory is resolved to its real path; fixtures use no names that differ only in case; signals and their exit codes are compared. The mixture-of-loops reference MUST run live on both systems. Every per-OS expectation MUST be marked `inferred` until a macOS runner has confirmed it.
  - divergence: DV-071; DV-022
  - test: CT-141-135
  - status: unverified (check: a macOS runner runs the oracle; verified-on: —; pin: the macOS version of the runner)

- **F141-FR-036**: A macOS runner MUST pass the parity oracle before any release. Until it has, every statement of any specification about macOS MUST stay `unverified`, and the release check MUST say so. The first macOS run MUST be reported as a research result: which expectations held and which did not.
  - test: CT-141-136
  - status: unverified (check: the first run of the oracle on a macOS runner; verified-on: —; pin: the macOS version of the runner)

- **F141-FR-037**: The tests of the oracle MUST be in three test tiers that run apart: hermetic (the port against golden captures), reference (the live differential run) and platform (the macOS runner). A fixture whose prerequisite is missing MUST be reported as a skip with its reason and never as a pass. At the release check a skip MUST block. The release run MUST therefore meet every prerequisite that a scenario of the catalogue declares; for `FX-26/root-sandbox-assertion` it MUST capture the reference and run the port with the effective user id 0, in a disposable environment of the reference tier that holds no credential and reaches no address other than loopback (F141-FR-038).
  - test: CT-141-137

- **F141-FR-038**: No test and no build job of the oracle MUST call a paid or external model API. The oracle MUST make this checkable: a run MUST fail when a stub or a side under test opens a connection to an address other than loopback, and when a variable that holds a credential of the machine reaches a run.
  - test: CT-141-138

#### G4 — The second suite and the owner decisions

- **F141-FR-039**: The second suite MUST run every fixture of the first suite, unchanged, on the port with the `parity` profile and row 1 of the profile set to `micro`, and nothing else changed. The stubs MUST behave exactly as in the first suite and MUST never declare a unit of work. Its two captures are capture A, the port with the layer off, which the first suite produced, and capture B, the port with the layer on. Both MUST include the surfaces S-14 to S-16.
  - ep: EP-04 `specstride.loop-layer/1` (consumes)
  - divergence: DV-012
  - test: CT-141-139

- **F141-FR-040**: The second suite MUST compare capture A with capture B after normalization and MUST remove only the entries of the layer allowlist. The allowlist MUST be generated from the rows of the divergence register that name a layer field: DV-016, DV-017, DV-018, DV-020, DV-052 and the announcement of DV-053. An entry MUST name its surface and its field, event, block or logical name; an event by its type in the event catalogue of feature 111, a file of state by its logical name in feature 100, annex B §B.5. The entry of DV-052 names the check manifest `phase:<N>:manifest`, which holds the record of its derivation and the pins, and `phase:<N>:protected-set`; the task list as read at launch (`run:<runId>:task-list`) is written in every run and is no entry (CQ-084). An entry that matches nothing in any fixture MUST fail the suite. A difference outside the allowlist MUST fail the suite and MUST be reported as a possible breach of gate integrity. An entry whose field cannot appear on any surface the second suite compares MUST be listed as "not reachable" with its reason and is not an entry.
  - divergence: DV-016; DV-017; DV-018; DV-020; DV-052
  - test: CT-141-140
  - assumption: CQ-028 (the `[LOOP]` line and the status line of DV-018 are not printed in compatibility output, which the second suite keeps)

- **F141-FR-041**: Apart from the comparison, the second suite MUST assert for every phase of every fixture that the counters of capture A and capture B are equal: passes used, reject count, MALFORMED streak, numbers of phase attempts and yield count. It MUST also assert that the sets of exit codes, stop reasons and run states seen in capture B are subsets of those seen in capture A.
  - divergence: DV-013; DV-014; DV-015
  - test: CT-141-141

- **F141-FR-042**: For a fixture whose verification gate does not execute (verification mode `plan` or `off`), the second suite MUST expect the classic loop with the announced reason `gate-not-executing`, and the announcement MUST be the only difference.
  - divergence: DV-053
  - test: CT-141-142

- **F141-FR-043**: The oracle MUST treat the owner decisions and the known tensions as follows. Micro-loops: off in the first suite, the second suite as above. Session continuation: off, with the assertion of F141-FR-011. Counts that survive a resume: the resume scenarios of FX-13 pass the reset flag on the port. Launch by default: the oracle drives commands and never a host skill; modes compare through the mode map, and the one case "no execution phrasing" is waived. Default proposer and critic: every fixture names both roles, and the one fixture that names none is waived. Quota pause: no stub emits a quota signal. Staleness: checked where the reference checks it. Glob expansion: compared as it is, with no waiver.
  - divergence: DV-009; DV-010; DV-011; DV-044; DV-004; DV-005; DV-082; DV-019
  - test: CT-141-143

- **F141-FR-044**: The oracle MUST prove itself. The reference compared with itself MUST give `equal` on every surface of every family. A seeded difference in any one surface MUST give `different` on that surface. The same fixture run twice on one side MUST give the same normalized capture. The feasibility probe of the research MUST be repeated as a test: the Specstride reference runs three phases with one rejection against stub agents, ends with exit 0, and leaves the same tree twice.
  - test: CT-141-144

- **F141-FR-045**: The oracle MUST never be part of the product package, and the product package MUST hold no file of the oracle, no stub and no fixture. The oracle MUST be built in this order: first the stubs with FX-01, FX-02 and the dry run of FX-35; then the normalization rules N-01 to N-08 with the layout tables; then the exercise map and the remaining families in the order of clusters not yet covered; then the second suite, once the micro-loop layer exists.
  - test: CT-141-145

### Key Entities

| Entity | What it is |
|---|---|
| Reference tree | A read-only copy of a baseline at its pinned commit, in scratch |
| Pin | The commit id and the tree hash of one reference system |
| Fixture family | A set of scenarios with one subject, with a stable id `FX-nn` |
| Scenario (fixture) | One declaration with its files: command, variables, stub scripts, template, expected exit code, surfaces, `proves` |
| Stub | A scripted stand-in for an agent, the engine, a command, an installer or a sink |
| Script | The steps of one stub in one scenario, as verbs per invocation index |
| Transcript | The records a stub writes, one per invocation |
| Capture | The surfaces of one run of one side |
| Golden capture | A committed, normalized capture of the reference |
| Normalized capture | A capture after the rules N-01 to N-29, with the count of replacements per rule |
| Result | `equal`, `waived (<register row>)` or `different`, per fixture and surface |
| Waiver | One accepted difference for one fixture and one surface, keyed to a register row |
| Register map | One entry per row of the divergence register with its handling in the oracle |
| Exercise map | Per scenario, the files and lines of the reference it executed |
| Inventory supplement | The two rows this feature adds for the write sites of the structured path |
| Layer allowlist | The entries the second suite may remove, generated from the register |
| Per-OS expectation | A stated difference between Linux and macOS, `inferred` until confirmed |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F141-SC-001**: Release condition. A release candidate is blocked in 100 per cent of the cases in which any fixture surface reads `different`, the fixtures of dsh, Codex and prime included; and the number of results `different` on the released build is 0.
- **F141-SC-002**: Claims are checked. 100 per cent of the ids in the `proves` lists of all parity tests pass the claim check of the exercise map, and 100 per cent of the traceability rows with a kept disposition are named by at least one test.
- **F141-SC-003**: Inertness. On every fixture the second suite shows 0 differences outside the layer allowlist and equal counters.
- **F141-SC-004**: The oracle detects. 100 per cent of seeded differences, one per surface and family, give `different`; the reference compared with itself gives `equal` on 100 per cent of surfaces.
- **F141-SC-005**: Determinism. The same fixture run twice on the same side gives the same normalized capture in 100 per cent of fixtures.
- **F141-SC-006**: No model is called. Over a full run of both suites, the number of connections to an address other than loopback is 0, and the number of credentials of the machine that reached a run is 0.
- **F141-SC-007**: The sources stay untouched. After a full run, the commit, the branch, the index and the working tree of each source repository are the same as before, and each reference tree equals its pinned tree hash.
- **F141-SC-008**: macOS. A macOS runner has passed the oracle on the build to be released; before that, 100 per cent of macOS statements are marked `unverified`.
- **F141-SC-009**: Citable. For 100 per cent of the traceability rows with a kept disposition, the declaration of a parity test can be written from this specification alone and is accepted by the declaration check.
- **F141-SC-010**: Rules and waivers earn their place. The number of normalization rules that replace nothing, of waivers that match nothing and of allowlist entries that match nothing is 0 on the released build.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no state of the three as-is systems is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a row in the divergence register | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| Every parity test passes before any release | Ruling 32 |

| Feature-specific constraint | Source |
|---|---|
| The reference is Python and shell at `9cab15d` and `9c88f86`; the source repositories are never written | Decision 4; Principle XVIII |
| The oracle and the test kit are never shipped inside the product package; the test kit is published separately | R15 A-4; ruling 30 |
| The product contains no oracle-only code path | LR-10 |
| No test and no build job calls a paid or external model API | Principle XII |
| The reference systems run in their own language. They are the reference and not a component of the product, so they need no entry in the Language Ledger | Decision 4; ruling 18 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, how traces are collected,
where golden captures are stored, and the build jobs.

## Extension points

This feature implements no extension point. It consumes three, as a caller of the product and
never as a part of it.

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-08 | `specstride.event-sink/1` | consumes | The compatibility projection is the sink whose output the surface `events` compares |
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | consumes | The generic stub is declared by a harness descriptor of the fixture |
| EP-04 | `specstride.loop-layer/1` | consumes | The second suite switches the layer `micro` on |

Interface contracts of feature 100 this feature depends on:

| Interface contract | Version | Where |
|---|---|---|
| Normalization rules, layout tables, alias and component tables, further maps | `specstride.oracle-normalization/1` | Annex X §X.8, F100-FR-213 to F100-FR-215 |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7, F100-FR-210 to F100-FR-212 |
| State layout and logical names | `specstride.layout/1` | Annex B §B.5 |
| Exit codes per process and per command; stop reasons | as listed | Annex E §E.3, §E.4; annex F §F.8; annex G §G.4 |
| CLI protocol, output modes, line grammar | protocol 1 | Annex G §G.1 to §G.3, F100-FR-175, F100-FR-176 |
| Event envelope | `specstride.event/1` | Annex X §X.1 |
| List of closed sets | — | Annex X §X.6, rows 85 and 86 |

## Rows of the `parity` profile

This feature introduces no switch of the product and adds no row to the `parity` profile. It
reads rows 1 to 133. The second suite changes row 1 and no other row (F100-FR-211).

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 141. All are closed by design, except the results of
the comparator, which annex X §X.6 already holds as row 86.

| Closed set | Members | Unknown value |
|---|---|---|
| Results of the comparator | `equal`, `waived` with its register row, `different` | `different` |
| Kinds of stub | proposer, critic over HTTP, critic as a CLI, diagnostician, engine, verification command, plugin installer, telemetry sink | The fixture is refused |
| Verbs of the proposer stub | The eleven of §O.3 | The fixture is refused |
| Verbs of the critic stub and of the diagnostician stub | The eleven of §O.3 | The fixture is refused |
| Verbs of the engine stub | The six of §O.3 | The fixture is refused |
| Verbs of the verification command stubs, the installer stub and the sink stub | The four, three and three of §O.3 | The fixture is refused |
| Surfaces | S-01 to S-16 of §O.4 | The test is refused |
| Handling of a register row in the oracle | normalization rule, off, mapped, waiver, layer field, not observable, none needed, no differential test | The suite fails |
| Variants of a scenario of FX-35 and FX-36 | `@engine-stub`, `@full-stack` | The test is refused |
| Test tiers of the oracle | hermetic, reference, platform | The test is refused |
| Status of a fixture family | active, retired | Read as retired |

Open sets: fixture families and scenarios (open by catalogue), names of stub executables and
harness stubs (open by data).

## As-is behaviour not carried

The traceability files assign no row to feature 141 with the disposition `superseded-by` or
`dropped`. The one retired fixture family is recorded here because other features may look for it.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none assigned to this feature) | — | — |
| Family FX-37 | Onboarding of mixture-of-loops: links into named hosts, exits 2 to 7. Its items belong to feature 113 | DV-056 |

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| 011 SC-008 | translated | F141-FR-018 | PT-141-011SC008-* |

The oracle consumes the whole behaviour inventory, 2,785 items in 255 clusters, and carries none
of them as a behaviour of its own.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: How many rows does the divergence register have, given that the brief says 85? → A: 94 at the session, DV-001 to DV-094. The register map of F141-FR-023 covers every row the register holds. (Source: `consolidation.md` section 6.8; `APPROVAL.md` stands over the brief)
- Q: Does the dsh plugin request protocol get a family of its own, given that the brief places its scenarios inside FX-17 and FX-18 and opens a family only if they cannot live there? → A: A family of its own, FX-38. The baseline shows that they cannot live there by subject: a pass that ends with an install is exempt from every breaker, and one of the three ends of the protocol is a restart pass, which is the end of neither family. (Source: the pass-loop script of the Specstride baseline at `9cab15d`, lines 2047 to 2074; B-0768, B-0769; `traceability.md` section 5, item 17)
- Q: Where does a fixture with a declared overlay live? → A: In a family of its own, FX-39, declared through the as-is overlay variable of the harness, which the environment alias table of feature 100 maps. (Source: `traceability.md` section 5, item 2; feature 100 annex X §X.8; the registry module of the baseline, which says that no shipped entry declares an overlay)
- Q: Do the scenarios of dsh, Codex and prime get families of their own? → A: No. They are scenarios inside FX-01, FX-06, FX-07, FX-18, FX-25 and FX-26, as the brief and the traceability files assign them. (Source: brief 141, heading 4; `traceability.md` section 5, item 18)
- Q: Does the product get a mode for the oracle? → A: No. The oracle selects the profile `parity` by ordinary configuration and names the engine stub through row 41 of the profile. (Source: LR-10; F100-FR-210)
- Q: Which commit of mixture-of-loops counts, given that its checkout is on another branch with uncommitted changes? → A: Only `9c88f86`. The working tree of a source repository is neither read nor changed. (Source: `STAGE-B-RULES.md` section 2; R18 O-1)
- Q: Is a home directory a compared surface, which R18 O-5 does not list? → A: Yes, as the surface `home`. The overlay items and the plugin protocol write into the home or a throwaway home, and no other surface shows it. The as-is end-to-end tests of mixture-of-loops take a snapshot of the home as well. (Source: B-0624, B-0986, B-0435; `tests/e2e/home_snapshot.py` at `9c88f86`)
- Q: Which configuration does the second suite use? → A: The profile `parity` with row 1 set to `micro` and nothing else changed. (Source: F100-FR-211; R27 D1.1)
- Q: Is the engine stub reached by a seam inside the product? → A: No. By the search path and the switch of row 41, since the engine is a child process. (Source: `architecture.md` section 4; R15 F-09)
- Q: How does the oracle treat the items and the as-is assets of the locally registered backend? → A: Its 19 items are `superseded-by DV-064`; no fixture, no stub name, no imported asset; its name is found at run time and stored nowhere. (Source: `traceability.md` section 1.4 rule 8; DV-064)
- Q: What does a parity test have to declare? → A: `proves:`, `fixture:` and `surfaces:`. In a task of `tasks.md`, `surfaces:` may be left out, as the fixed form of `STAGE-B-RULES.md` section 4 shows only the first two. (Source: R18 O-8 item 1; `STAGE-B-RULES.md` section 4)
- Q: When does a claim of a whole cluster hold? → A: When every item of the cluster that the traceability files assign to the feature of the test, with a kept disposition, was executed by a fixture of a test of that feature that claims the cluster. Integrated in F141-FR-032. (Source: `STAGE-B-RULES.md` section 4, field `origin:`; `traceability.md` section 1.5 rules 4 and 5)
- Q: Which capture of the Specstride reference does the release condition use on macOS, where that reference does not run? → A: The golden captures that the live run on Linux confirmed on the same build, with the per-OS expectations. Integrated in F141-FR-025 and F141-FR-035. (Source: R18 O-9; Options compared, option C; DV-071)
- Q: Is a reference tree, or an archive of one, committed to the repository of the product? → A: No. It is produced at run time from a local clone or from a release archive with a pinned hash. Golden captures are outputs of a run and are committed. Integrated in F141-FR-025. (Source: R18 O-1 item 2; R18 open question 9)
- Q: Is the order of events between two writers compared? → A: No. Order is compared inside each class of writer (N-14). The risk that a defect depends on the interleaving is accepted and recorded. No requirement changes. (Source: feature 100 annex X §X.8, N-14; R18 risk 7)
- Q: Is there a limit for the run time of the suite? → A: Not in the specification. One fixture of three phases took 10 seconds with the tick set to 1; the run time of the full suite has medium confidence. The plan states starting values and the build measures them. (Source: R18 F-18; R18 Recommendation, "Confidence")
- Q: Which questions could the sources not answer? → A: Four, CQ-027 to CQ-030, listed under "Assumptions".

### Session 2026-09-29, follow-up after the fan-out

Questions that the other features raised, answered from the code of the baselines. No question was put to a person.

- Q: Where do the scenarios `codex-missing-key`, `dsh-conflicting-providers` and `dsh-invalid-model-ref` of FX-07 end on the reference (CQ-116, CQ-141)? → A: With engine exit 1 and the stop reason `critic_unavailable`, after three phase attempts scored MALFORMED. The same holds for `missing-key`, `unknown-harness-name` and `prime-empty-variant`: all six errors are raised inside the critic call, and the handler of a failed call scores them. None of the six reaches engine exit 3. The catalogue is corrected. (Source: the critic module at `9cab15d`, lines 1883, 1904, 1963, 1978, 2370, 2395 and 2729 to 2743; the engine script, lines 2133 to 2136 and 2163 to 2182; six runs of the reference with stub agents on 2026-09-29)
- Q: What does reach engine exit 3 with the stop reason `critic_config`? → A: Critic exit 3, which the critic gives in five places, all before its call: the spec is missing, the format is unknown, the phase is not found, the verification plan is invalid, the phase evidence is missing. Through the front door a fixture reaches it with a proposer stub that rewrites the spec without the phase (`phase-not-found`). The five places are scenarios that drive the critic. (Source: the critic module, lines 2533, 2542, 2545, 2554, 2562; runs of the reference on 2026-09-29)
- Q: Where does a pass that fails before the harness starts end (FX-18)? → A: It depends on the path. On the structured path the pass is an error, and two of them end the loop with pass-loop exit 7. On the plain-output path a pass that ends with an exit code other than 0 is not an error, and three passes without progress end the loop with pass-loop exit 8. The engine exits 4 in both cases. (Source: the pass-loop script, lines 2245 to 2261 and 2273 to 2350; eleven runs of the reference on 2026-09-29)
- Q: How is `consecutive-errors-legacy` reached, given that an exit code is no error on the plain-output path? → A: By two passes that a watchdog ends; the script of the scenario uses the verb `silent`. (Source: the pass-loop script, lines 2300 to 2335; one run of the reference)
- Q: Who owns a scenario that a feature asked for? → A: A scenario that a feature asked this feature for is delivered here and is a scenario of 141. A scenario that a feature adds as data of its own tests is a scenario of that feature and is registered in the catalogue under its name. (Source: CQ-027, recommended answer; the tasks of 109, 123, 124 and 131)
- Q: How many pattern names does the scenario table hold, and against what are they resolved? → A: 13, with 175 members. The first analyze report said 21; the number cannot be reproduced from the table. Nine are resolved against closed sets of feature 100, annex X §X.6 (rows 13, 14, 69, 106, 107, 146, 158, 171, 217), three against the as-is assets and the code of the baselines, and one, the error classes of FX-33, against the validators of the baseline, because no closed set exists. (Source: annex X §X.6; the baselines)
- Q: How many rows does the divergence register have now? → A: 119, DV-001 to DV-119 (117 until the analyze run of feature 104 wrote DV-118 and DV-119 on 2026-09-30). The register map covers all of them. (Source: `consolidation.md` section 6, on 2026-09-30)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register had 94 rows when this specification was written and has 119 on 2026-09-30. The brief's figure of 85 is out of date.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The compatibility projection (feature 111), compatibility output (features 119 and 123) and the argument tables of the harness adapters exist when the fixtures that compare them run.
- The inventory and the traceability files are changed by the orchestrator on the reports of this feature. The coverage script is changed by this feature at implementation (F141-FR-034; the plan, "Structure Decision").

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer. All of them were closed on 2026-09-30 with the recommended
answer (`docs/ecosystem/CLARIFY-QUEUE.md`), so the reading of each row stands; the same holds for
CQ-186 and CQ-187, which the plan and F141-FR-015 cite.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-027 | Who writes a scenario that a parity test needs and the first set lacks? The brief puts the fixture families in the scope of this feature; it does not say who writes each scenario | This feature delivers the first set of §O.2. A feature adds a scenario inside the scope of a family, with the verbs and surfaces given here | F141-FR-030 |
| CQ-028 | Does the second suite compare compatibility output or default output? F100-FR-211 and R27 D1.1 change row 1 only, which keeps compatibility output; register row DV-034 says the second suite compares default output, where the `[LOOP]` line of DV-018 appears | Compatibility output, as feature 100 says. The `[LOOP]` line and the status line are then not reachable in the second suite and are proven by the tests of their features | F141-FR-040 |
| CQ-030 | May as-is fixture files of the baselines, which are under the Apache-2.0 licence, be kept in the repository of the product, which is under the MIT licence? R18 leaves it open (open question 9); the brief says the files land in the oracle | Yes, as assets of the oracle that are never shipped in the product package, unchanged and with the licence notice of their baseline | F141-FR-012 |
| CQ-116, CQ-141 | Do the scenarios of FX-07 follow the catalogue (engine exit 3) or the code of the baseline? | The code, as both questions recommend. The catalogue is corrected for all six scenarios | F141-FR-013, F141-FR-015 |
| CQ-193 | May a fixture of FX-18 or FX-26 change the reference tree, or shadow the interpreter, to reach a line that runs only when a file of the reference is missing or cannot be written? | No. The reference tree is read-only and a stub takes only the names of §O.3. An item that no fixture reaches goes to the correction list | F141-FR-002, F141-FR-033 |
| CQ-194 | Which are the error classes of the validation of a launch contract? No closed set of feature 100 holds them | The ten validators of the baseline, as the table of pattern members names them. Feature 107 is asked to state them as a closed set | F141-FR-030 |
| CQ-029 | How is a reference output compared that lists the entries of the registry, one of which the port does not carry? The register assigns unknown-name messages to N-15, and the component-name table has no such row | N-15 applies: the entry is taken out of the reference side before storage and comparison. Feature 100 is asked for the row | F141-FR-029 |

### Repairs after the cross-feature review (2026-09-30)

| Item | What changed |
|---|---|
| W-141-01 | F141-FR-002 gains the rule that a fixture MUST NOT change the reference tree or shadow the interpreter to reach a line, with `assumption: CQ-193`; the placeholder `CQ-pending-141-1` becomes CQ-193 (also F141-FR-033) |
| W-141-02 | The FX-33 pattern source states the ten validators as the classes, with `assumption: CQ-194`; the placeholder `CQ-pending-141-2` becomes CQ-194 (also F141-FR-030) |
| W-141-03 | The logical name in the register-map entry of DV-029 is written `gate:<N>:approved` |
| W-100-14 | Verified: no occurrence of "iteration" in this feature outside the literals `iteration-limit`, `iteration-returned-by-yield`, `MAX_ITER`, `iter_*` and `giveIterationBack`. Nothing to change |
| W-100-26 | The plan states that Python 3 is a requirement of development and that no Python file is in a published package (CQ-186) |
| W-X-05 | Counts updated to what holds today: register DV-001 to DV-117 (117 rows, map covers all); behaviour inventory 2,785 items; `parity` profile rows 1 to 131 |
| W-X-06 | FX-11 and F141-FR-035 write "a second engine start" where one start of the engine is meant |
| W-X-13 | Both `CQ-pending-141-*` placeholders replaced by CQ-193 and CQ-194 (see W-141-01, W-141-02) |
| W-X-18 | `ep:` lines added: F141-FR-010 (EP-02, consumes), F141-FR-019 (EP-08, consumes), F141-FR-039 (EP-04, consumes) |
| W-100-16 | The `$id` of the six schema files and the `schema` field of the seven data files use the form `urn:specstride:schema:internal:141:<name>/<major>` |
| DV-116 | F141-FR-012 cites the row DV-116 and confirms its proposed oracle handling: the field `schema` of the port's inventory is removed by a normalization rule before the comparison on FX-30; the row was written by act B-8.6 and is consumed by F108-FR-027 |
| (register follow) | The register-map entry of DV-034 follows the register of 2026-09-30: ruling 68 makes the row off under `parity`; what the second suite compares stays CQ-028 |
| B-8.7 (2026-09-30) F141-FR-015 | `divergence: DV-117` and `assumption: CQ-187`: the two FX-07 scenarios of a missing credential compare because the switch of DV-117 is off under `parity` |
| B-8.7 (2026-09-30) F141-FR-020 | The normalizer implements N-01 to N-29: annex X §X.8 now holds N-29 for DV-116 (surface `state`, plan, data model, research, T032 and T056 follow) |
| B-8.7 (2026-09-30) F141-FR-012 | Names the rule N-29 of annex X §X.8 in place of "requested by report"; the register-map entry of DV-116 names N-29 |
| B-8.7 (2026-09-30) F141-FR-037 | The release run meets every declared prerequisite; `FX-26/root-sandbox-assertion` runs on both sides with the effective user id 0 in a disposable environment of the reference tier (T068, T071) |
| B-8.7 (2026-09-30) FX-33 | The pattern source cites annex X §X.6 row 274 (owner 107, F107-FR-040); `invalid-not-promoted` is driven through `launcher-render`, because at the baseline only the renderer raises it; the family row names that entry point (T111) |
| B-8.7 (2026-09-30) DV-115 | The register-map entry states the confirmation: no fixture makes the local append fail, and F141-FR-002 forbids one to (CQ-193); the row stays "not observable" |
| B-8.7 (2026-09-30) plan row VI | The Language Ledger reading cites CQ-186 for the three Python tools of the build; the `sitecustomize` file is written into the scratch root and held by no package |
