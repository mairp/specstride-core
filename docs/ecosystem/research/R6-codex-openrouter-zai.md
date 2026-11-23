# R6 — Codex, OpenRouter, z.ai

Accessed 2026-09-29. Doc URLs: Codex docs moved from developers.openai.com/codex/* (308 redirect) to learn.chatgpt.com/docs/*.

## Prior art consulted
- `/root/specstride/lib/backends.py` at `9cab15d` (read via `git show`): line 56 registers `codex` for both roles with no qualifier (`Qualifier("none")`). OpenRouter and z.ai are **not registered**; there is no stream field for codex (raw text). Reused as the baseline; extended below.
- `proposer.sh@9cab15d:585-589`: codex proposer runs `codex exec --dangerously-bypass-approvals-and-sandbox [--model M] "$prompt"` with prompt as argv (no `--json`, no stdin, no resume). The comment at line 585 says "UNVERIFIED on this host".
- `lib/critic.py@9cab15d:2360-2364`: the codex **critic bypasses the Codex CLI**; it calls the OpenAI chat API directly (`OPENAI_BASE_URL`, `OPENAI_API_KEY`, default model `gpt-5`). Context windows come from `_CODEX_MODEL_CONTEXT_TOKENS` (`critic.py:175-177`: gpt-5 400000, gpt-5.5 1000000, gpt-5.4 1050000), fallback 128000 (`critic.py:201`), override `SPECSTRIDE_CRITIC_CONTEXT_TOKENS`. Consequence: today a ChatGPT-subscription-only user cannot use codex as critic. Any OpenAI-compatible endpoint (OpenRouter, z.ai) could already be reached through `OPENAI_BASE_URL`, but only as "codex".
- BRIEF-COMMON.md and prompt §0, §2 (decisions 6, 7, 8, 10, 13, 17).

## Questions answered
**Codex**
- Headless: `codex exec [PROMPT]` (alias `e`); prompt from argv or stdin (`-`; piped stdin is appended as a `<stdin>` block when a prompt is also given). Final message to stdout, progress to stderr; `--json` makes stdout JSONL; `-o FILE` writes the last message; `--output-schema FILE` constrains the final response shape.
- Auth: ChatGPT sign-in (subscription, OAuth; device-code login for headless, beta) or API key (`codex login --with-api-key` reading stdin; `CODEX_API_KEY` env for `exec`). API key mode has fewer features than ChatGPT sign-in.
- TS SDK: `@openai/codex-sdk`, Node 18+, `startThread()`, `thread.run()`, `runStreamed()`, `resumeThread(id)`. Docs recommend the Codex **app server** for richer server-side integrations.
- Sandbox/approval: `-s read-only|workspace-write|danger-full-access`; `-a on-request|never`; `--approve-for-me`; `--dangerously-bypass-approvals-and-sandbox`; `--add-dir`; `-C`; `--ephemeral`; `--ignore-user-config`; `--ignore-rules`; `--skip-git-repo-check`.
- Resume: `codex exec resume [--last | SESSION_ID] [PROMPT]`; also `codex exec fork`.
- Usage limits: subscription is a 5-hour rolling window plus a weekly cap; the CLI prints text such as "You've reached your 5-hour message limit. Try again in ...". No structured exit code or JSON event for it was confirmed.
- Config home: `CODEX_HOME`, default `~/.codex`; `config.toml`; auth cached in `auth.json` or OS keyring (`cli_auth_credentials_store`); `-c key=value` overrides; `-p` layers `$CODEX_HOME/<name>.config.toml`.

**OpenRouter**
- OpenAI-compatible chat completions at `https://openrouter.ai/api/v1/chat/completions` (SSE streaming, `tools`). Also an Anthropic-format `/api/v1/messages` endpoint (the errors page refers to it).
- TS SDK `@openrouter/sdk` (ESM only), `openRouter.chat.send(...)`; docs mention `callModel` agent helper without detail.
- Models: `GET /api/v1/models` returns per-model `context_length` and `supported_parameters` (includes `tools`). This gives a **known context window at runtime**, satisfying decision 17 for a critic.
- Rate limits: free models 20 req/min, 50/day (under 10 credits) or 1000/day (10+ credits). `X-RateLimit-Limit/Remaining/Reset` only on OpenRouter-generated 429s; `Retry-After` on 429/503/402. `GET /api/v1/key` reports credit limit, remaining and usage. 402 = insufficient credits.
- Proposer or critic: OpenRouter is a **model endpoint only**; it has no tool loop. A proposer needs a local loop provided by (a) a harness that accepts a custom endpoint (opencode, R10; Codex via a custom provider in `config.toml`, unverified; Claude Code via Anthropic-compatible URL, unverified for OpenRouter), or (b) a loop Specstride would have to own (its own harness, decision 6/13 territory). Tool-less critic: yes, directly.

**z.ai**
- General API `https://api.z.ai/api/paas/v4` (OpenAI-compatible; Bearer key). Anthropic-compatible base `https://api.z.ai/api/anthropic` (used with `ANTHROPIC_AUTH_TOKEN`, model map GLM-5.3 / GLM-5.3-Flash). The coding-plan OpenAI-format endpoint was not found in the fetched pages (unverified).
- SDKs: official Python `zai-sdk` and Java; no official TS SDK found; use OpenAI SDK with the base URL.
- Models: GLM-5.3 (1M context, 128K max output, function calling, streaming — docs.z.ai/guides/llm/glm-5.3); GLM-5.3-Flash. Older ids are redirected.
- Rate signals: HTTP 429 with body codes 1302 (request rate), 1305 (overload), 1308 (usage limit with reset time), 1310 (weekly/monthly exhausted), 1309 (plan expired). This is a structured quota signal usable for pause/resume.
- GLM Coding Plan (facts only): Lite/Pro/Max, credits per 5-hour window and per week (2,000/10,000; 12,000/60,000; 28,000/140,000), per-model multipliers, off-peak discount, peak Mon-Fri 14:00-18:00 Singapore. Docs state usage is "restricted to the supported tool ecosystem" (Claude Code, Cline, OpenCode and others). How it may be consumed by a third-party orchestrator: **see R8**.
- Proposer/critic: same as OpenRouter — endpoint only. The most direct proposer route is Claude Code or opencode pointed at the Anthropic-compatible URL; the tool loop is then the harness's.

## Findings
1. `verified-local` `codex-cli 0.153.4` at `/usr/bin/codex`; `codex --version` prints `codex-cli 0.153.4`. `codex exec --help` shows `--json`, `-o`, `--output-schema`, `--ephemeral`, `--ignore-user-config`, `-s`, `-C`, `--skip-git-repo-check`; `codex exec resume --help` shows `[SESSION_ID]` UUID or thread name and `--last`; `codex login --help` shows `status` and `--with-api-key`; `codex doctor` exists (not run: it may touch auth).
2. `verified-doc` JSON event types: `thread.started`, `turn.started`, `turn.completed` (with `usage.input_tokens/cached_input_tokens/output_tokens`), `turn.failed`, `item.started`, `item.completed`, `error` (learn.chatgpt.com/docs/non-interactive-mode, 2026-09-29).
3. `verified-doc` CI auth: `CODEX_API_KEY` recommended; ChatGPT mode in CI means seeding `auth.json` (same page). Specstride must never read it; the adapter only checks `codex login status` (`verified-local` exists via help).
4. `verified-doc` `exec` defaults to read-only sandbox (same page). `verified-local` today's proposer.sh bypasses sandbox entirely (`proposer.sh@9cab15d:586`). A tool-less critic should use `-s read-only`, `--ephemeral`, `--ignore-user-config`, `--ignore-rules`.
5. `verified-doc` Codex TS SDK `@openai/codex-sdk`, Node 18+ (learn.chatgpt.com/docs/codex-sdk). `unverified`: transport (believed to spawn the CLI and exchange JSONL; not confirmed in docs fetched); exact version.
6. `verified-doc` Codex subscription limits are a 5-hour window plus weekly cap, token-metered since April 2026 (secondary sources via web search: help.openai.com article 11369540, GitHub issues 3734 and 41553; treated as `unverified` for exact rules). Quota signal in headless mode: `unverified` (likely a `turn.failed`/`error` event with message text; not probed, no paid calls).
7. `verified-doc` OpenRouter facts above (openrouter.ai/docs/api-reference/overview, /limits, /errors, /docs/sdks/typescript, /docs/guides/overview/models, 2026-09-29). The `/api/v1/messages` Anthropic endpoint: `inferred` from errors page text; the dedicated doc page returned 404.
8. `verified-doc` z.ai facts above (docs.z.ai/api-reference/introduction, /api-reference/api-code, /devpack/overview, /devpack/tool/claude, /guides/llm/glm-5.3).
9. `inferred` Neither OpenRouter nor z.ai has a CLI to detect; "detect" means presence of a configured key/base URL, which must be declared by the consumer (discovery reads nothing secret, decision 17). Doctor check is a `GET /api/v1/models` (OpenRouter) or a declared model list; no paid call needed.
10. `inferred` Both are natural targets for the generic descriptor (R20): OpenAI-compatible chat + SSE + Bearer + models list. A dedicated adapter is only justified for the quota-signal parsing (OpenRouter `/key`, z.ai body codes), which the descriptor would need a small "quota-signal" hook to express.

## Version/date pins
| Item | Pin | verified-on |
|---|---|---|
| Codex CLI | `>=0.153.4 <0.154` (only 0.153.4 seen; `exec --json` flags checked by `--help` only, no run) | 2026-09-29 |
| `@openai/codex-sdk` | unpinned (version not confirmed); pin at adapter build time | not verified |
| OpenRouter API | `/api/v1` (unversioned service) | 2026-09-29 |
| `@openrouter/sdk` | unpinned (version not confirmed) | not verified |
| z.ai API | `/api/paas/v4`, `/api/anthropic`; models GLM-5.3, GLM-5.3-Flash | 2026-09-29 |

Model ids and context windows are not pinned per decision 17; they are read at run time (`/models`) or declared.

## Options compared
Proposer route for OpenRouter/z.ai:
| Option | Tool loop owner | Evolvability | Cost |
|---|---|---|---|
| A. Critic only in Wave 1 | none needed | high | no proposer via these endpoints |
| B. Via a harness with custom endpoint (opencode, Claude Code w/ Anthropic URL, Codex custom provider) | that harness | high; reuses tested adapters | endpoint quirks per harness; depends on R10 |
| C. Specstride's own harness | Specstride | medium | large build; decision 13 "eventually" |

Codex critic route:
| Option | Subscription usable | Tool-less | Notes |
|---|---|---|---|
| Direct API (today) | no | yes | needs `OPENAI_API_KEY`; own context table |
| `codex exec -s read-only --ephemeral --ignore-user-config --json` | yes | approximately (agent may still read files; not truly tool-less) | fits decision 7 only if the sandbox is accepted as "no tools" |
| TS SDK | yes | same as above | adds a dependency |

## Recommendation
1. Codex: adapter drives `codex exec --json` (JSONL stream, `-o` for final text, `resume` for continuity), invoked as a process; do not depend on the TS SDK in Wave 1 (fewer moving parts; SDK is optional later). Proposer uses `-s workspace-write` (not the bypass flag) unless the consumer opts in. Detect with `codex --version` plus `codex login status`. Retain the direct-API critic path for API-key users.
2. OpenRouter and z.ai: Wave 1 as **critic endpoints via the generic OpenAI-compatible descriptor**, context window from `/models` (OpenRouter) or declared (z.ai, GLM-5.3 1M/128K). Proposer role only through a harness that hosts the loop (option B).
3. Add a quota-signal hook to the descriptor for OpenRouter (429 headers, `/key`) and z.ai (codes 1302/1308/1310) for R14.
Confidence: medium-high on API shapes; medium on Codex quota signalling and SDK transport (not probed).

## Matrix rows
| harness | tested or unverified | detect/version | headless | stream | TS SDK | auth modes | tier | proposer? | tool-less critic? | quota signal | terms status | version pin + verified-on | delivery wave |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Codex | tested-adapter target; today's proposer path marked unverified in code; CLI installed locally, never run here | `codex --version`; `codex login status` | `codex exec --json -s <mode> -C <dir> [PROMPT|-]`; `resume --last/ID` | JSONL events (`thread.*`, `turn.*`, `item.*`, `error`) | `@openai/codex-sdk` (Node 18+) | ChatGPT sign-in (OAuth, device code); API key (`CODEX_API_KEY`) | see R8 | yes (own tool loop, sandboxed) | approximate: `-s read-only --ephemeral`; or direct API critic | subscription 5h + weekly text message; API key: HTTP 429 from OpenAI; structured event unverified | see R8 | `>=0.153.4 <0.154`, 2026-09-29 | Wave 1 |
| OpenRouter | unverified (docs only, no calls) | none (endpoint); `GET /api/v1/models` liveness | HTTP `POST /api/v1/chat/completions` (also `/api/v1/messages`) | SSE, OpenAI chunks; mid-stream errors as `finish_reason:"error"` | `@openrouter/sdk` (ESM) | API key (Bearer) only | see R8 | no own loop; only via a harness (opencode etc.) | yes | 429 + `X-RateLimit-*`, `Retry-After`; 402 credits; `/api/v1/key` | see R8 | API `/api/v1`, 2026-09-29 | Wave 1 critic (generic descriptor); proposer later |
| z.ai | unverified (docs only, no calls) | none; declared endpoint | HTTP `POST https://api.z.ai/api/paas/v4/chat/completions` (OpenAI); `https://api.z.ai/api/anthropic` (Anthropic) | SSE; abnormal end in `finish_reason` | none official for TS (`zai-sdk` is Python/Java); use OpenAI SDK | API key (Bearer); GLM Coding Plan subscription (limited to supported tools) | see R8 | no own loop; via Claude Code/opencode on Anthropic URL | yes (GLM-5.3, 1M ctx) | HTTP 429 codes 1302/1305/1308/1310 (reset time in 1308) | see R8 | GLM-5.3 endpoints, 2026-09-29 | Wave 1 critic (generic descriptor); proposer later |

## Open questions / risks
- `unverified`: Codex behaviour when the subscription limit hits during `exec --json` (event name, exit code). Needs one small probe later; none run here (no logins, no paid calls).
- `unverified`: whether the Codex TS SDK spawns the CLI; whether Codex can target OpenRouter/z.ai through a custom provider in `config.toml`.
- z.ai coding-plan restriction to supported tools may forbid use as a headless critic or as an orchestrator-driven proposer: **see R8**. If R8 rules it out, z.ai is API-key (pay-as-you-go, `/api/paas/v4`) only.
- Tool-less critic through Codex is only approximate; DECISIONS-PENDING candidate: accept `-s read-only` Codex as a qualifying critic under decision 7, or require the direct-API path. Default to proceed on: direct API for tool-less, Codex exec read-only marked "tools available".
- Codex docs domain moved; adapters must not hard-code doc URLs.
- Today's `critic.py` context table contains model names that go stale; decision 17 implies read from `/models` or declared config.
