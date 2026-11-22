# Research synthesis

Status: **complete; approved by the owner on 2026-09-29, with the rulings applied.** All 27 reports and 7 verifier reports are in. Facts are dated 2026-09-29. Where a verifier corrected a report, the
corrected value is shown and the verifier is named.

Sources are the reports in `research/`. Tags used there (`verified-doc`, `verified-local`, `inferred`,
`unverified`) are carried into the "Basis" columns below.

---

## 1. Harness Capability Matrix

The matrix is a snapshot of the registry, not a boundary (decision 17): the last row stands for every
agent or endpoint the consumer has that Specstride has no tested adapter for.

Tier and terms are given for two audiences (R8v): **P** = personal use by the account holder,
**D** = a distributed product used by third parties on their own accounts.

### 1a. Identity, invocation and stream

| Harness | Tested or unverified | Detect / version command | Headless invocation | Stream format | TS SDK |
|---|---|---|---|---|---|
| Claude (Claude Code CLI) | Tested adapter in Wave 1. Flags verified against the installed CLI (R3v); the flag combination has not had a live call | `command -v claude`; `claude --version`; `claude auth status` | `claude -p --output-format stream-json --verbose`, prompt on stdin | NDJSON: `system/init`, `assistant`, `user`, `system/api_retry`, `rate_limit_event`, `result` | `@anthropic-ai/claude-agent-sdk` 0.3.284; proprietary licence; an optional Tier 2 transport in Wave 1 with API keys only, never bundled (owner rulings 20, 70) |
| Codex | Adapter target; installed (0.153.4), never run here | `codex --version`; `codex login status` | `codex exec --json -s <mode> -C <dir> -` | JSONL: `thread.*`, `turn.*`, `item.*`, `error` | `@openai/codex-sdk` |
| dsh | Tested today (Specstride `9cab15d`, proposer and critic) | `command -v dsh`; `dsh --version` | `dsh --profile headless "<task>"` with `DSH_HOME`, `DSH_PERMISSION_MODE` | None: final text on stdout, `dsh: CODE: msg` on stderr, exit 0 or 1 | unverified |
| prime (`prime-agent`) | Tested today (Specstride `9cab15d`, proposer and critic) | `command -v prime-agent`; `prime-agent -v`; the `prime` launcher has no version flag | `prime-agent -p --mode json --no-session --cwd <dir>`, prompt on stdin | JSONL schema v3 | unverified |
| pi | Unverified (help and docs only) | `command -v pi`; `pi --version` | `pi -p --mode json`, prompt on stdin | JSONL, session header v3 (same family as prime) | documented, not exercised |
| Gemini CLI | Unverified (docs and source; not installed) | `gemini --version` (inferred) | `gemini -p --output-format stream-json --model <pin>` | JSONL: init, message, tool_use, tool_result, error, result | `@google/gemini-cli-sdk` in repo, unpublished |
| GitHub Copilot CLI | Unverified (docs; not installed) | `copilot --version` | `copilot -p --output-format json --model <pin> --no-ask-user` | JSONL, schema undocumented | `@github/copilot-sdk` 1.0.15 (MIT) |
| opencode | Earlier live smoke on 1.18.32 (2026-09-26); not installed here | `command -v opencode`; `opencode --version` | `opencode run --format json -m p/m --dir D < prompt`, or `serve` + SDK | JSONL: `step_start`, `tool_use`, `step_finish`, `text`, `error`; no init or result record | `@opencode-ai/sdk` 1.18.33 |
| OpenRouter | Unverified (docs; endpoint) | `GET /api/v1/models` | `POST /api/v1/chat/completions` | SSE, OpenAI chunks | `@openrouter/sdk` |
| z.ai | Unverified (docs; endpoint) | Declared endpoint | `POST /api/paas/v4/chat/completions`; Anthropic format at `/api/anthropic` | SSE | None official for TS |
| Specstride's own harness | Not yet designed | — | — | — | — |
| **Generic discovered harness** | Unverified (detected, declared or locally verified) | From the descriptor: `command -v <binary>` and a declared version argv; endpoints: credential-variable presence and `GET <modelsPath>` | From the descriptor: argv array with the prompt by stdin, file or bounded argv; endpoints: `POST <chatPath>` | Declared: `text`, `jsonl`, `sse-openai`, `sse-anthropic`; unknown fields are `null` | None required |

### 1b. Auth, tier, roles, quota, terms, pin and wave

| Harness | Auth modes | Tier (P / D) | Proposer? | Tool-less critic? | Quota signal | Terms status after R8v | Version pin, verified-on | Wave |
|---|---|---|---|---|---|---|---|---|
| Claude | Subscription login; OAuth token env; API key; cloud providers | P: 1 (default), 2. **D: 2** by default, Tier 1 as a consumer opt-in with a warning (owner ruling 1) | Yes | Yes: no tools, MCP denied, fresh minted session, budget cap, one turn, empty working directory; or direct HTTP at Tier 2 | `rate_limit_event` (status, `resetsAt`, `utilization`, advance warning); `result.is_error` | P explicit; D needs the Commercial Terms; Tier 3 prohibited | 2.1.259 – 2.1.284, 2026-09-29 | 1 |
| Codex | ChatGPT sign-in; API key | P: 1 with conditions, 2. D: 2 | Yes (own sandboxed loop) | **Yes, with read-only tools**, by owner ruling 57: read-only sandbox in the working tree, network off, the proposer's files hidden; also by direct API | Text message on 5-hour and weekly windows; structured event unverified | P conditional; D Tier 2 | `>=0.153.4 <0.154`, 2026-09-29 | 1 (owner ruling 32b) |
| dsh | Held in dsh's own home | 1, fleet only | Yes; no session continuation (DP-016) | Yes, by a denylist of tool ids plus read-only mode; stale-prone, so exact pin and a doctor check | `dsh: QUOTA` / `RATE_LIMIT` on stderr | Unknown terms (licence and upstream not established) | `==0.1.0-rc.8`, 2026-09-29 | 1 as adapter (owner ruling 32b); 2 as host |
| prime | Provider env keys or auth file | 1, fleet only | Yes; no sandbox, no permission mode | Yes: `--no-tools --no-skills --no-context-files --no-session` | In-stream error record; the process exits 0 on a provider error | Unknown terms | `>=0.7.3 <0.8`, 2026-09-29 | 1 (owner ruling 32b) |
| pi | Provider env keys or auth file; OAuth logins exist | 1, gated by the back end's row; its Claude OAuth path is Tier 3 and refused | Yes; no permission mode | Yes by flags; not verified by a run | In-stream `stopReason: error`; exit code unverified | Gated by back end | `>=0.80.6 <0.81`, 2026-09-29 | 1 (owner ruling 32b) |
| Gemini CLI | Google login; API key; Vertex | **2** (consumer Google login ended 2026-06-18; Tier 1 only with Code Assist Standard or Enterprise) | Yes | Yes by a deny-all policy; needs a probe. Window 1,048,576 | Typed quota errors in source; how they surface is unverified | Tier 2 explicit; Tier 3 a stated violation | `>=0.61.0 <0.62.0`, 2026-09-29 (docs) | 3+ |
| Copilot CLI | `copilot login`; token env | 1, 2 for both audiences | Yes | Not proven: no zero-tool mode documented, default-model window undocumented, so never auto-picked | AI-credit billing; no documented headless signal | Explicit | `>=1.0.89 <1.1.0`, 2026-09-29 (docs) | 3+ |
| opencode | Provider env keys; its own auth file; logins | 2; 1 only gated by the back end's row | Yes, with API-key providers | Yes by a deny-all agent (config-verified only); direct HTTP preferred | `APIError` 429; may hang instead of exiting | Its own docs prohibit Claude subscription use through it | `>=1.18.32 <1.19`, 2026-09-29 (docs) | 3+ |
| OpenRouter | API key | 2 | Only through a harness that hosts the tool loop | Yes; window from `/models` | 429 with `X-RateLimit-*`, `Retry-After`; 402 for credits | Explicit | API `/api/v1`, 2026-09-29 | 1 as critic through the generic descriptor; adapter 3+ |
| z.ai | API key; Coding Plan subscription | P: 1 through a listed tool, 2 (API). D: 2 (API) | Only through a harness | Yes (1M window) | 429 with body codes 1302, 1305, 1308, 1310 | API explicit; Coding Plan restricted to listed tools | Model endpoints, 2026-09-29 | 1 as critic through the generic descriptor; adapter 3+ |
| Specstride's own harness | — | — | — | — | — | — | — | last |
| **Generic discovered harness** | As declared: the harness's own login, or a key by `env:`, `file:` or keychain reference | 1 or 2 only; 3 refused | Yes if the six proposer capabilities hold | Endpoints: yes when the context window is known. CLIs: only when the consumer configures it, never auto-picked | A declared map of status or exit code to a quota class; otherwise unknown, and the doctor says so | Unknown unless the terms data has a row: Tiers 1–2 with a doctor warning | No pin; local verification records version and date | 1 |

### 1c. Containment (from R11)

Containment levels are an adapter capability: C0 none, C1 permission lists, C2 operating-system sandbox,
C3 external isolation.

| Harness | Allow-all flag and what it removes | Vendor sandbox | Ceiling |
|---|---|---|---|
| Claude | Permission bypass removes all prompts and safety checks; refused as root outside a recognised sandbox | Bash sandbox (Seatbelt; bubblewrap), a separate setting | C2 |
| Codex | One flag removes sandbox and approvals together | Seatbelt; bwrap with seccomp; network off by default | C2 |
| Gemini CLI | `--yolo` removes approval of all actions | Optional | C2 when enabled |
| Copilot CLI | `--allow-all` removes tool approval and path and URL limits | None documented | C1 |
| opencode | Permissive by default | None documented | C1 |
| pi | None: it has no permission prompts | None | C0 |
| dsh | Set by `DSH_PERMISSION_MODE` | unverified | unverified |
| Generic discovered harness | Whatever the descriptor declares | Unknown | C0 until shown otherwise |

---

## 2. Host Capability Matrix

| Host | Skills | Hooks | Background processes | UI surfaces | Packaging | Evals |
|---|---|---|---|---|---|---|
| **Claude Code** 2.1.284 (`verified-local`, corrected by R3v) | `skills/<name>/SKILL.md`, namespaced `/specstride:…`; listing capped at 1,536 characters | 30+ events. `SessionStart` for re-attachment, `UserPromptSubmit` for status, `PreToolUse` as launch guard. Plain stdout becomes context for four events. `asyncRewake` hooks are subject to `timeout` (600 s default). Plugin hooks do not run under `--bare` | No plugin API for a process that outlives the session. Bash background tasks die with the session. `claude --bg --exec` exists but hosts work inside Claude Code's own supervisor; rejected on portability grounds. **Our own detached runtime with PID, start-time and state files is required** | Terminal text; a user-owned status line; monitor notifications. MCP UI resources are dropped by Claude Code today; no IDE webview API for plugins | Marketplace sources include npm. `bin/` shim on the Bash tool's PATH. `userConfig`. Dependencies install with scripts disabled, so native code must come as prebuilt optional dependencies | `claude plugin eval`: six graders, exit codes 0, 1, 2, 130, 143; PR gating needs `--ablation none` |
| **dsh** 0.1.0-rc.8 (`verified-local`) | `<name>/SKILL.md` in five scanned roots, the same skill format; 500-character catalog cap; `/name` invocation | No user-facing hooks; in-process events for code plugins only (DP-003) | In-process jobs that die with the session; the engine must detach itself | Web client only on this install; slash commands on web only; no TUI, no status line | No manifest: a skill is a directory copy; plugins are npm packages added to a profile | None upstream; a session-log driver has to be built (DP-002) |

What the two hosts share is a capability port, not a plugin artifact: the same skills, and the
`specstride` CLI with `--json` as the only channel from host to engine.

---

## 3. Findings that drive decisions

Each finding names its report and, where one exists, what the verifier did to it. "Drives" names the
decision in `decision-log.md`.

### 3.1 Where the time goes (R21, recomputed by R21v)

| Finding | Value | Basis | Drives |
|---|---|---|---|
| Reference run, 127.9 h alive | 82.0 h waiting on detached jobs, 44.1 h proposer, 0.44 h critic | Measured; reproduced within 0.1 h | D3 |
| Acceptance job time spent after its first failure was known | 29.3 h of 42.9 h | Measured; reproduced | D3 |
| Claude-proposer population | 55 runs, 515 passes, 331 attempts, 253.9 h. Without the reference run: 69 % proposer, 23 % verification, 4 % critic | Measured | D2 |
| Killed passes, Claude proposer | 37 passes, 32.5 h, 24.9 % of proposer time | Measured; reproduced | D1 |
| Attempt time in failed attempts | 43.3 % (Claude) | Measured; reproduced | D1 |
| Restarts | 135–143, none automatic | Measured; R21v corrected 137 to a range | A3 |
| Cold start | Median 0.5 min to first action; median first turn 107.8k tokens | Measured | D9, D10 |
| Unrecorded cost, reference run | $480–$600 on top of $516 recorded | Estimated; R21v corrected $590 to a range | X0 precondition |
| Blocked passes | 47–76; not a measurement, closing messages are cut to 160 bytes | Estimated | A11 |
| The reference run executed the live working tree of the engine, not a fixed version | — | R21v | Baseline quoted in two tiers |

### 3.2 The as-is specs cover a small part of the behaviour (R18, R19)

| Finding | Value | Drives |
|---|---|---|
| Behaviour items in the inventory | 2,783 (Specstride 2,466, mixture-of-loops 317) in 255 clusters | F2, F6 |
| Items with no covering as-is requirement | 2,402, of which 2,040 appear nowhere in the as-is specs | F6 |
| Draft dispositions of the 110 FRs and 23 SCs | 38 ported, 34 merged, 20 translated, 11 superseded, 28 deferred, 2 dropped (R19; final counts in `traceability.md`) | F2 |
| Stop reasons | 14, of which ten appear in no as-is requirement | `consolidation.md` §4 |
| Conflicts that need a ruling | 27 (14 from R19, 13 raised since) | `consolidation.md` §2 |
| Glob expansion in the critic snapshot | Already fixed at the baseline (`d6dab74`) | F5 |
| The oracle is feasible on Linux | The baseline engine ran against stub agents: exit 0, the same tree twice, 10 s | F1 |

### 3.3 Lisa (R1, checked by R1v)

| Finding | Value | Drives |
|---|---|---|
| Which tree | Neither is a superset. 18 packages identical; the dashboard is newer on `76adfdc` | B2 |
| Gap table | 028: 2 yes, 16 partial, 12 no. 011: 0, 6, 21. R1v sampled 36 of 57 cells; 1 failed | B1 |
| Missing in Lisa's core | MALFORMED limit, recovery cycle, yield, oscillation halt, learning knobs; the loop has no seam for them | B1 |
| Never called in a run | `otel`, `web`, `memory`, `plugins`, `hooks`, the scheduler queue | B1 |
| Lisa's lock | Multiple winners in 297 of 300 rounds (R2v) | A8 |

### 3.4 Port and language (R2, recounted by R2v; R17)

| Finding | Value | Drives |
|---|---|---|
| Code today | 20,932 lines in 42 product files; 19,121 lines of tests in 63 files. Recount: difference 0 | B4 |
| Estimate | 16,300–25,850 TypeScript lines; R2v widened R2's range | B4 |
| Node against Go | Startup 62–83 ms against 3 ms; idle about 34 MB against about 2 MB. Measured under load | B3 |
| Native modules | `fs-ext` compiles at install; `node-pty` 1.1.0 ships no Linux prebuild | B3 |

### 3.5 Hosts and context (R3, R3v, R4, R17, R13)

| Finding | Value | Drives |
|---|---|---|
| Claude Code has no plugin API for a process that outlives the session | Verified in docs and the installed CLI. Whether a detached process survives is unverified | A2, the spike |
| R3v checked 102 claims | 90 confirmed, 7 corrected, 5 not confirmable. No flag that R3 or R5 relies on is missing | C1 |
| Today's host skill | About 20k tokens of mandatory instructions; 801 polls in the reference run, 98 % unchanged | E2 |
| The reference launch contract | 535 KB, sources 2.1 MB | E1 |
| dsh | No plugin manifest, no user-facing hooks, no eval command, no session continuation in headless mode | E5 |
| MCP UI resources | Dropped by Claude Code today | E6 |

### 3.6 Terms and auth (R8, checked by R8v)

| Finding | Value | Drives |
|---|---|---|
| Tier 3 | No provider's own page permits it | C2 |
| Tier 1 in a distributed product | Not allowed as a default for Claude, Codex and the z.ai Coding Plan | C3 |
| Gemini CLI | Consumer Google login ended 2026-06-18; Tier 2 | matrix |
| A throwaway config home has no login | Claude, Gemini CLI, Copilot | C8 |

### 3.7 Security (R11, R23v)

| Finding | Value | Drives |
|---|---|---|
| The approval marker can be forged | An empty file inside the proposer's write scope; resume trusts its presence | C10, A4 |
| The baseline runs the proposer uncontained | Bypass flags; asserts a sandbox itself when run as root | C7 |
| Gate red team | 24 findings, 4 of which break gate integrity; 27 new rules, all adopted by R27 | D4, D5 |
| Architecture red team | 52 findings, 11 blocking; 15 proposed changes, adopted in `architecture.md` | A3, A4, F6 |

### 3.8 Run acceleration (R22 to R27)

| Finding | Value | Basis | Drives |
|---|---|---|---|
| Fail-fast | 14.7–23.4 h of a 29.3 h pool | Ceiling measured, central inferred | D3 |
| The layer alone | 0–12 % of alive time on ordinary phases, net of 3–10 % check overhead | Inferred | D2 |
| The default configuration | 6–19 % on a 50:50 mix, ceiling 26 % | Inferred | D2 |
| Session continuation | At most 1–2 % of Claude pass time; breaks even in tokens at about 24–86 turns | Estimated | D9 |
| The "Inherited obligations" block | 69–70 % of the proposer prompt | Measured | D10 |
| Parallelism | Ceiling 1.18–1.30x for task parallelism; 0 h of the waiting | Measured and inferred | D11 |
| Escalation | Pool at most 21.1 h, 8.4 % of Claude attempt time | Measured pool | D8 |
| Per-step routing | Measured negative on coding work in the benchmark R25 cites | Cited | A1 |
| Self-built memory | Fails to beat memory-off in current coding-agent benchmarks | Cited | D12 |

### 3.9 What stays unverified

| Subject | Why | Carried by |
|---|---|---|
| All macOS behaviour | No macOS host | DP-006 |
| Detach survival inside a host session | No host session was run | The spike in feature 122 |
| The Claude critic's flag combination | No live call | One probe per role |
| Quota signals of Codex, Copilot and Gemini CLI | No structured signal documented or observed | R14; adapter features |
| About two thirds of A6's sources | R22 hit the usage limit before re-fetching them | A candidate follow-up, R28 |
| Check duration | No inner check has ever run | Experiment X5 |
| Gemini CLI and Copilot CLI, opencode | Not installed; documentation only | Adapter features |

### 3.10 Paid probes

None. No report made a paid model call.
