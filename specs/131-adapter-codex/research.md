# Research: Codex harness adapter (feature 131)

Summary of the reports in `docs/ecosystem/research/`, which stay the sources. Nothing was probed
by this feature. The installed `codex` command was read with `--version` and `--help` on
2026-09-29 (codex-cli 0.153.4).

## Decisions

| # | Decision | Rationale | Alternatives considered | Source |
|---|---|---|---|---|
| 1 | Drive `codex exec` as a process with the JSONL option; no SDK | Fewer moving parts; the SDK is optional later | The vendor's TypeScript SDK | R6 recommendation 1 |
| 2 | Proposer default is the sandbox mode `workspace-write` with approvals never; the allow-all flag only under `parity` or a C0 opt-in in user configuration (not the environment, not a flag; CQ-183) | Strictly safer than the baseline; network off | Keep the allow-all flag | R6; R11 F-23; rulings 34, 38 |
| 3 | Critic form (a): `read-only`, ephemeral, user config and rules ignored, in the working tree | Lets a login-only consumer use Codex as critic | Direct call only | Rulings 57, 57a; R6 |
| 4 | Form (a) needs a confirmed read denial, else it is not used | Repair history must stay withheld | Trust the mode | Ruling D1; R29v open question 1 |
| 5 | Form (b) stays, through the generic client | Parity side; consumers with a key | Drop it | DV-001 |
| 6 | Window: parity table with fallback 128,000; otherwise declared, endpoint, adapter table, else not a critic | Principle IX | Keep the fallback | Brief 131 heading 3 |
| 7 | Quota: login limit is text, confidence `text`; API 429 and exhausted credit by status | No structured event is documented | Assume a structured event | R6 finding 6; R14 B6 |
| 8 | Continuation by the thread id of the first record, never the latest session | The latest session may be the consumer's own | `--last` | R24 F-5 |
| 9 | At auth tier 1 the adapter writes and removes nothing in the real home; continuation is off until capture 4 (added 2026-09-30) | The reading nearest to the letter of Principle VIII and ruling 36; the same reading as the Claude adapter takes | Removing session state from the real home: the removal is a write | CQ-143 |
| 10 | The fallback window of 128,000 is kept under `parity` only and is a recorded deviation from Principle IX (added 2026-09-30) | Principle XVIII asks for the as-is value; outside the profile the letter of Principle IX holds | The fallback as a floor outside the profile | CQ-145; DV-106 |
| 11 | Captures 1, 2, 4 and 5 are paid, capture 3 is not; no test waits for a capture (added 2026-09-30) | A run of `exec` calls a model; the sandbox command does not | Counting captures as free | Principle XII; `APPROVAL.md`, "Not approved: any paid probe" |
| 12 | `retryable` follows the class (added 2026-09-30) | One value per class for every adapter | A value per entry | Feature 100, annex E §E.3 |

## Findings from `--help` of 0.153.4 that differ from or add to the reports

| Finding | Effect |
|---|---|
| `exec` has no approval-policy option; R6 lists one | Approvals never is a configuration override, `unverified` (F131-FR-009) |
| `exec resume` has no sandbox option and no working-directory option | The sandbox mode of a continued pass is a configuration override, `unverified` (F131-FR-012) |
| `exec` reads the prompt from standard input when the prompt is `-` or absent | Prompt on stdin is possible (Principle VIII). Under `parity` the prompt is a positional argument all the same, as at the baseline (DV-031) |
| `--ignore-user-config` keeps auth on `CODEX_HOME` | Works at auth tier 1 with the real home |
| `--ephemeral` runs without persisting session files | Used where continuation is off |
| A `sandbox` subcommand runs a command under the harness's sandbox | A model-free read-denial probe may be possible; equality with `exec`'s policy is `unverified` |
| `--skip-git-repo-check` exists | Needed only outside a git repository |

## What is not known, and the capture that settles it

| # | Fact | Requirements that wait |
|---|---|---|
| 1 | The record and exit code at a login limit | F131-FR-032, F131-FR-034 |
| 2 | What the first record shows of sandbox mode and session; the approval policy in force | F131-FR-009, F131-FR-020, F131-FR-036 |
| 3 | Whether the read-only sandbox denies reads of named paths | F131-FR-011, F131-FR-019 |
| 4 | Whether session files live outside the home while the login stays | F131-FR-013 |
| 5 | Whether several headless processes share one home | F131-FR-004 |

## Terms

R8v rows 7 and 9, D2 and D3: auth tier 1 is `conditional` for `personal` and not a default for `distributed`; auth tier 2 is `allowed`. The OpenAI terms of use have a clause on programmatic extraction with no carve-out for Codex (R8v risk 5).
