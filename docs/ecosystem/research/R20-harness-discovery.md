# R20 — Harness discovery

Agent: R20. Date: 2026-09-29. Governing text: decision 17 (harness discovery) and decision 7 (critic
independence). Feeds `architecture.md` (adapter seam, discovery, extension points),
`research-synthesis.md` (generic discovered-harness row) and feature 109-adapter-seam-claude.

Reading note on web evidence: every `verified-doc` claim below was read through the WebFetch tool, which
returns a machine summary of the page. Field names, URLs and numbers are as returned on 2026-09-29; a
verifier should re-read any value that becomes load-bearing in a spec.

Naming note: today's registry and Lisa's CLI harness both carry an entry that is specific to the owner's
machines. It is written here as "a locally registered backend".

## Prior art consulted

| Source | What it is | Reused / extended / contradicted |
|---|---|---|
| `/root/specstride/lib/backends.py` at `9cab15d` (172 lines) | Today's registry: a closed tuple `REGISTRY` of five entries (lines 52-61), each with a name, per-role qualifier spelling, optional `stream` (line 41) and optional `overlay` (line 45). Owns "names and spellings only" (lines 6-8). | **Extended.** The per-entry optional fields (stream, overlay, and the announced preflight/version fields, lines 8-10) are the seed of the descriptor. **Contradicted:** the closed tuple, and the "adding a backend" procedure (lines 15-20) that needs a code arm in two dispatchers plus five documentation sites. Decision 17 forbids that as the only route. |
| `/root/specstride/proposer.sh` at `9cab15d`, `run_agent()` (line 531 onward) | One `case` arm per backend; unknown backend returns 127. Shows the real variation between harnesses: prompt by argv (dsh, codex) or stdin (claude, prime); permission flag spelling; model flag; throwaway home overlay; binary override env var. | **Reused** as the list of things a descriptor must be able to express. |
| `/root/specstride/lib/critic.py` at `9cab15d` | `critic_call()` (line 2353) dispatches by name. Two generic HTTP shapes already exist: `call_claude` (Anthropic Messages, line 1875) and `call_openai_chat` (OpenAI chat completions, line 1902). `_critic_context_tokens()` (line 180) resolves the window from per-model tables with an env override that always wins. `call_dsh_shell` (line 2093) makes a CLI tool-less by writing a patch that disables each tool. | **Reused:** the two HTTP shapes become the two endpoint kinds of the generic adapter; the override-wins rule is kept. **Contradicted:** falling back to a default window for an unknown model (line 143 default, used at lines 204-213). Decision 17 requires a *known* window for an auto-picked critic, so "unknown" must disqualify rather than default. |
| `/root/specstride/lib/stream_seam.py`, `lib/agent_stream.py` at `9cab15d` | One seam, a `FORMATS` registry of stream formats (agent_stream.py lines 215-221), each row a `StreamFormat` with a `Capability` (signals it can surface) and flags `synth_init`, `synth_terminal`, `no_activity` (stream_seam.py lines 187-206). | **Reused.** The signal list `init,text,tool,evidence,result` is the capability vocabulary for "read the stream"; synthesized init and terminal records are what lets a raw-text harness be a proposer. |
| `/root/specstride/lib/backend_overlay.py` at `9cab15d` | Declarative throwaway config home: `{"vars": (...), "seeds": (...)}` per backend; no shipped entry sets it. | **Reused** as the descriptor's `isolation.configHome` block. |
| `/root/lisa/packages/agents/src/provider.ts` at local `main` `363e6a3` (identical to `76adfdc` for this package; `git diff --stat 76adfdc 363e6a3 -- packages/agents` shows only `package.json`, 1 line) | `AgentProvider` with two capability levels, `harness` and `completion` (lines 129-140); registry enforces capability-to-method contract at registration (lines 186-202); typed failure vocabulary `HARNESS_FAILURE_KINDS` incl. `context_window_exceeded`, `rate_limited`, `authentication_failed` (lines 29-37); `provider/model` policy entries (line 272). | **Reused** almost as is: the two capability levels map exactly onto "proposer" and "tool-less critic". **Extended:** Lisa's registry is in-memory and populated by code; it has no discovery, no descriptor, no tested/unverified state, no context window. |
| `/root/lisa/packages/agents/src/openai-compat/completion.ts` at `363e6a3` | `OpenAiCompatCompletion` (lines 78-151): `fetch` to `${baseURL}/chat/completions`, base URL and key from options or `OPENAI_BASE_URL`/`OPENAI_API_KEY` (lines 93-96), usage from the response, cost always 0. `CliHarness` (line 198): hard-coded argv per backend name (lines 210-229), usage always zero, evidence-file gate ends the pass (lines 255-262). | **Reused:** the endpoint adapter is the right size for the generic critic. **Contradicted:** `CliHarness.buildArgv` is a closed `if` chain and passes the prompt in argv; it reads only `OPENAI_*` so a second OpenAI-compatible provider cannot coexist; no streaming, no window, no failure classification. |
| `old/028-as-is-specstride/spec.md` | `028 FR-021` (one registry, five names), `028 FR-028` (overlay declaration), `028 SC-007`, `028 FR-016` (resume replays backends). | Dispositions are R19's. R20 notes `028 FR-021`'s closed list is superseded by decision 17 and `028 FR-016` supports "the pick is replayed, not recomputed". |
| `.specify/memory/constitution.md` v2.0.3 | VII One Backend Registry (lines 207-232), VIII hermetic proposer (234-258), IX critic has no tools and a known budget (260-279), X recorded versions, XI truthful telemetry, XII build with what we have. | VII's "one registry" is kept in spirit (one resolved registry, many sources); its closed name list is not. IX is the origin of the known-window qualification. XI's "unknown values are null, never invented" governs every probed field. |
| `prompts/analysis/A1-local-fact-check.md` §8 | Installed CLIs. | Verified again below. |
| Finished neighbour reports R3, R4, R6, R7, R10 | R6 and R10 both already route OpenRouter, z.ai and "any OpenAI-compatible endpoint" through R20's generic descriptor; R7 asks for the descriptor route for Gemini and Copilot. | **Consistent.** This report supplies the descriptor they assume. |
| External: DeepSeek API docs, opencode docs, models.dev, LiteLLM docs, Agent Client Protocol, VS Code Language Model API, Claude Code docs, Claude API reference, OpenRouter API reference | See Findings. | Prior art for sources, catalogues and free metadata endpoints. |

## Questions answered

### Q1. What are the discovery sources, and how is each read without secrets, logins, paid calls or state changes?

Discovery is a pure function from the environment to a list of **candidates**; it never runs a model.
It is split into a **passive pass** (always on; no network, no secret dereferenced) and a **metadata
pass** (free GET requests only, and only for a candidate whose credential *reference* is known).

| # | Source | What is read | How it stays safe | Result |
|---|---|---|---|---|
| S1 | Tested adapters | Each adapter's own `detect()` | Adapter code shipped with Specstride; bounded to `command -v`-style lookup and a version command | Candidate, state `tested` |
| S2 | Binaries on PATH | For each **descriptor** (bundled or consumer-supplied) of kind `cli`: is `detect.binary` on PATH? Then `detect.version.args` with a timeout. | Discovery never executes a binary that no descriptor names. It does not scan PATH for "things that look like agents". Only the argv in the descriptor's `detect` block is run; stdin closed; 5 s timeout; output capped. | Candidate, state `unverified` |
| S3 | Known config homes | `stat` of the directory a descriptor names (`detect.configHome`) | Existence only. No file inside is opened. Credential stores (`auth.json`, `.credentials*`, token files) are never opened, by rule and by a deny-list in the reader. | Evidence that a harness is set up; raises confidence, never sufficient alone |
| S4 | Host-registered agents and MCP servers | Claude Code: project `.claude/agents/*.md` and plugin `agents/` frontmatter (`name`, `model`, `tools`); project `.mcp.json` server **names and type only**. dsh: nothing in the passive pass. | `~/.claude.json` is not read: it is a mixed state file that holds user and local MCP scope, including `env` and `headers` values. `.mcp.json` `env`, `headers` and `args` values are not read. | Informational only in v1 (see F9); not a critic source |
| S5 | OpenAI-compatible and Anthropic-compatible endpoints | Presence (not value) of well-known credential variable names from descriptors and the catalogue (for DeepSeek: `DEEPSEEK_API_KEY`); base URL from descriptor or non-secret `*_BASE_URL` variables, with any `userinfo@` part stripped and only scheme+host+path kept | `name in process.env`, never the value. The metadata pass may later send the credential to the descriptor's own `modelsPath` with a GET; redirects are refused so the credential cannot leak to another host. | Candidate, state `unverified` |
| S6 | Gateways | Host gateway variables by presence (`ANTHROPIC_BASE_URL`, plus consumer-declared gateway entry); metadata pass: `GET /v1/models` (and LiteLLM `/model/info` when declared) | Never the LiteLLM `/health` endpoint, which runs a real request against every configured model (F12). GET only. | One candidate per model the gateway lists |
| S7 | Consumer-declared entries | `harnesses:` in project `specstride.yaml` and user `~/.config/specstride/config.yaml`; descriptor files under `~/.config/specstride/harnesses/*.yaml` | Secrets appear only as `env:`, `file:` or keychain references (decision 6) and are dereferenced only when a call is made | Candidate; state `unverified` unless it selects a tested adapter |

Precedence when two sources describe the same harness id: consumer-declared entry, then tested adapter,
then bundled descriptor, then auto-detected default. This is decision 9's order applied to descriptors.
The resolved registry is written once per launch to the run's state (one file), so that the run and a
later resume see the same thing (Principle I).

### Q2. What is the descriptor schema?

See "Descriptor schema v1" under Findings, with full DeepSeek examples. It is versioned
(`descriptorVersion: 1`), declarative (no code, no shell strings: argv arrays only), and covers detect,
invoke headless, read the stream, authenticate, roles, context window and continuation.

### Q3. What is the smallest capability set for a proposer, and for a tool-less critic?

**Proposer (six required).**

| Id | Capability | Why it is the minimum |
|---|---|---|
| P1 | A non-interactive invocation that terminates by itself | Principle VIII "never wait for a human" |
| P2 | Accepts the prompt by stdin, or by a file path, or by argv with a declared size bound | Principle VIII; today's dsh and codex arms are argv-only (`proposer.sh` line 531 onward) |
| P3 | Works in a given working directory and can write files and run commands there, without asking | The evidence file is the completion signal; nothing else is needed from the harness |
| P4 | A declared way to suppress permission prompts (flag, env or mode), or a declaration that none exist | Guessing a bypass flag is not allowed; absence of a declaration disqualifies |
| P5 | An exit code | Producer status is recorded separately from the stream (`proposer.sh` `preserve_producer_status`) |
| P6 | A credential check that fails before pass 1 without a paid call, or the declaration `auth.preflight: none` with a doctor warning | Principle VIII "a missing credential fails fast" |

Everything else is optional and recorded as `null` when absent (Principle XI): structured stream, usage
and cost, version command, model selection, throwaway config home, session continuation. A raw-text
stream is enough, because the seam can synthesize `init` and terminal records (`stream_seam.py` lines
195-206). This is also what makes decision 21's default micro-loop level work on an unverified harness:
the runtime runs the checks, the harness only has to do P1-P5.

**Tool-less critic (six required).**

| Id | Capability | Why |
|---|---|---|
| C1 | One prompt in, one text reply out | Lisa `completion` level (`provider.ts` lines 98-120) |
| C2 | Tool-less **by construction** | Principle IX. For endpoint kinds it is structural: the request carries no `tools` array and a completion API cannot execute anything. For a CLI it needs a declared tool-disabling mechanism. |
| C3 | Known context window in tokens, with its source | Decision 17, Principle IX |
| C4 | A fresh session on every call | Decision 22 |
| C5 | Failure classification for at least auth, rate limit or quota, and context overflow | Otherwise a quota error reads as MALFORMED and burns an attempt; `critic.py` lines 132-140 record exactly that failure |
| C6 | A provider identity and model id, to decide diversity against the proposer | Decision 7 |

Optional: usage, cost, max output tokens, streaming.

### Q4. How are capabilities probed without paid calls?

A five-step ladder; each step is free, and the step that produced a value is stored with it.

| Step | Probe | Cost | Yields |
|---|---|---|---|
| L0 | PATH lookup, directory `stat` | none | installed? |
| L1 | Version and help commands from the descriptor; every flag the descriptor's `invoke` uses must appear in the help text | process start only | version, flag presence. Example here: `pi --help` lists `--print`, `--mode json`, `--no-tools`, `--no-session`, `--list-models`, `--offline`. |
| L2 | Credential **presence**: is the referenced env var set, does the referenced file exist | none | "credential present" (not "valid") |
| L3 | Free metadata endpoints, GET only, redirects refused, 3 s timeout: provider `/models`; gateway `/v1/models` | none billed; uses the credential | model list, and on some providers the window (DeepSeek `context_window`, Anthropic `max_input_tokens`, OpenRouter `context_length`) and credential validity (401 means invalid) |
| L4 | Bundled catalogue snapshot (models.dev and LiteLLM's JSON, both MIT), read offline | none | window, max output, price, tool-call support, each marked `source: catalogue@<date>` |

What cannot be learned without a paid call, and is therefore **declared or unknown**: that the verdict
format is followed, that a CLI really stays tool-less, the real quota signal, the real stream shape.
Those are what promotion tests (Q5).

Context window precedence: consumer-declared value, then provider `/models` live value, then tested
adapter table, then catalogue snapshot, then unknown. Unknown disqualifies the harness as a critic. A
window taken from the catalogue is reduced by a safety margin before the grounding budget is computed
(recommended 20 %; the critic owner, R5, sets the final figure).

### Q5. How is an unverified harness sandboxed, warned about and promoted?

**Sandboxed.**

- Tier 1 or Tier 2 only (decision 17). Tier 3 is refused with the reason.
- Environment allow-list: the subprocess gets a minimal base environment plus only the variables its
  descriptor names. An unknown binary does not inherit the consumer's other provider keys.
- Only the argv in the descriptor is used. No permission-bypass flag is guessed.
- Throwaway config home when the descriptor declares one; otherwise the doctor says the harness runs
  against the consumer's real config.
- Wall-clock and idle timeouts, output size cap, and the stream is treated as untrusted text: it is never
  interpreted as instructions or as a verdict.
- As a CLI critic (only when the consumer configures it): empty temporary working directory, prompt on
  stdin, declared tool-disabling mechanism mandatory.
- Anything beyond this (network egress, filesystem confinement) is R11's.

**Warned about.** Doctor row per harness with state, origin, what was probed and what was declared;
launch banner line; event at launch; digest field. Warnings never block (decision 7).

**Promoted.** Four states; the matrix collapses them to two (`tested`, `unverified`).

| State | Meaning | Matrix value |
|---|---|---|
| `detected` | Found by S2-S6, only free probes run | unverified |
| `declared` | Consumer wrote or confirmed the descriptor | unverified |
| `locally-verified` | Consumer ran `specstride harness verify <id>`: an opt-in, budget-capped live conformance run; result stored with harness version, descriptor hash and date | unverified (ranks first among unverified) |
| `tested` | Adapter shipped with Specstride: conformance suite with recorded fixtures in CI, version range and `verified-on` (decision 10), a terms row from R8 | tested |

A local verification is invalidated when the harness version or the descriptor hash changes.

### Q6. What is the auto-pick rule for the diverse critic?

See "Auto-pick rule" under Findings. In short: the fixed order of decision 17 is kept exactly; within
the "qualifying discovered harness" rung the rank is tested, then locally-verified, then other
unverified; then cost class; then quota state; then a fixed tie-break. The pick is stored and replayed on
resume. A quota signal pauses (decision 8); a hard failure demotes the pick for the rest of the run and
the next rung is taken, announced and recorded.

### Q7. How do opencode, LiteLLM, Lisa and editor pickers discover providers?

| Product | Mechanism | Lesson taken |
|---|---|---|
| opencode | Catalogue (models.dev) plus credentials file plus env variables plus a `provider` block in `opencode.json` for custom providers, which names an AI SDK package, a `baseURL` and per-model `limit.context` / `limit.output` | A custom provider is *data*, and the window is part of that data |
| LiteLLM | `provider/model` prefix; `openai/<model>` plus `api_base` for any compatible endpoint; env naming convention `<PROVIDER>_API_KEY`; community JSON with windows and prices; `validate_environment` reports missing variables; `get_valid_models(check_provider_endpoint=True)` queries the provider | Presence check of variables is a standard, free probe; the prefix convention matches Lisa's and today's `name[:qualifier]` |
| Lisa `openai-compat` | None. Constructor options or `OPENAI_*`; registry populated by code | The adapter body is reusable; discovery is missing entirely |
| Agent Client Protocol (Zed and others) | A public registry JSON of agents, each an `agent.json` manifest (id, name, version, description, distribution, args, env); a JSON-RPC `initialize` handshake that returns `agentCapabilities` (e.g. `loadSession`) and `authMethods` | A manifest per agent plus a free capability handshake is the closest existing analogue to the descriptor. It is the natural third `kind` later. |
| VS Code Language Model API | `vscode.lm.selectChatModels({vendor, family, id, version})`; each model exposes `maxInputTokens` and `countTokens`; use needs user consent | The picker exposes the window as a first-class property, and gates use behind consent |
| Claude Code gateway model discovery | Opt-in `GET /v1/models?limit=1000`, 3 s timeout, redirects treated as failure, off by default, result cached | The exact safety shape adopted for L3 |

## Findings

### Local facts

- F1 `verified-local` Today's registry is closed and code-bound. `lib/backends.py` lines 52-61 hold five
  entries; adding one needs an arm in `run_agent()` and/or `critic_call()` and edits to documentation
  sites (lines 15-20). An unknown name returns 127 (`proposer.sh`, final arm of `run_agent`).
- F2 `verified-local` Two generic HTTP critic shapes already exist and need nothing harness-specific:
  `critic.py` line 1875 (`/v1/messages`, headers `x-api-key` and `anthropic-version`) and line 1902
  (`/chat/completions`, `Authorization: Bearer`).
- F3 `verified-local` A wrong window source has already cost attempts. `critic.py` lines 132-140: a
  table value of 300000 against a route that honours 200000 produced `CONTEXT_WINDOW_EXCEEDED`, "which
  reads as MALFORMED and burns an attempt". Lines 148-155 record a second case where the wrong source
  put a window off by five times.
- F4 `verified-local` An unknown model gets a default window today (`critic.py` line 143, used at lines
  204-213). This is incompatible with decision 17's qualification rule for an auto-picked critic.
- F5 `verified-local` Lisa's provider boundary has exactly the two capability levels needed and a typed
  failure vocabulary (`provider.ts` lines 29-37, 129-140), and enforces the declaration at registration
  (lines 186-202). Its CLI harness reports zero usage and hard-codes argv per name
  (`openai-compat/completion.ts` lines 196, 210-229).
- F6 `verified-local` Installed on this machine (commands `command -v`, `--version`, `--help` only):
  `claude` 2.1.284, `codex`, `dsh` 0.1.0-rc.8, `pi`; not installed: `gemini`, `opencode`, `litellm`,
  `ollama`, and no binary named `deepseek`. `copilot` resolves to an editor shim, not a working CLI.
- F7 `verified-local` `dsh --help` shows a headless one-shot form `dsh --profile headless "<task>"`,
  `--patch <path>` overlays, `--dump-config`, and `--resume <session>` on a profile. `--dump-config` was
  **not** run: whether its output can contain secrets is `unverified`, so discovery must not call it.
- F8 `verified-local` `pi --help` lists `--print`, `--mode text|json|rpc`, `--no-tools`, `--no-session`,
  `--session-id`, `--list-models`, `--offline`. Help text alone is enough to confirm every flag a
  descriptor would use (probe step L1).

### The worked example and a naming collision

- F9 `verified-doc` "DeepSeek Harness" is an official DeepSeek product whose CLI is `dsh`, npm package
  `@deepseek-ai/dsh`, MIT, in developer preview (https://deepseek.com/harness/en/, 2026-09-29).
  `verified-local` Specstride's own source calls dsh "DeepSeek Harness" (`proposer.sh` `run_agent` dsh
  arm; `critic.py` line 2094). So decision 17's example, "a DeepSeek harness the consumer installed",
  names a product that §0 of the prompt already lists as having a tested adapter. See Open questions.
  This report therefore works the example in three shapes, which together cover every descriptor kind:
  (a) the DeepSeek API as an OpenAI-compatible endpoint, (b) the same API as an Anthropic-compatible
  endpoint, (c) the `dsh` CLI reached through the generic adapter, which is what happens in Wave 1,
  where only the Claude adapter ships (decision 13).
- F10 `verified-doc` DeepSeek API: base URL `https://api.deepseek.com` (OpenAI format) and
  `https://api.deepseek.com/anthropic` (Anthropic format); models `deepseek-flash` and
  `deepseek-v4-pro` (https://api-docs.deepseek.com/, 2026-09-29).
- F11 `verified-doc` DeepSeek `GET /models` returns per model `id`, `owned_by`, `name`,
  `context_window` (1048576 for both models), `max_output_tokens` (393216), `input_modalities`,
  `effort.supported_levels`, `api_capabilities` (https://api-docs.deepseek.com/api/list-models,
  2026-09-29). It returns no price. So the window of a DeepSeek critic is known from a free call.
  `unverified`: that the call is unbilled and needs a Bearer key; the page states neither, and no call
  was made.
- F12 `verified-doc` DeepSeek prices per 1M tokens, USD, peak/off-peak: `deepseek-flash` input
  0.30/0.15 (cache miss), output 1.20/0.60; `deepseek-v4-pro` input 1.32/0.66, output 3.96/1.98; context
  1M, max output 384K (https://api-docs.deepseek.com/quick_start/pricing, 2026-09-29). Note the pricing
  page says 384K where `/models` says 393216: a small example of why the source of a value is stored.
- F13 `verified-doc` DeepSeek error codes: 401 authentication, 402 insufficient balance, 429 rate limit,
  500, 503 (https://api-docs.deepseek.com/quick_start/error_codes). While waiting, the server sends
  empty lines (non-streaming) or `: keep-alive` SSE comments, and closes after 10 minutes without
  inference (https://api-docs.deepseek.com/quick_start/rate_limit). Both accessed 2026-09-29. A generic
  reader must therefore tolerate blank lines and SSE comments, and 402 belongs in the quota class.
- F14 `verified-doc` DeepSeek documents use with Claude Code through `ANTHROPIC_BASE_URL`,
  `ANTHROPIC_AUTH_TOKEN` and the `ANTHROPIC_DEFAULT_*_MODEL` variables
  (https://api-docs.deepseek.com/guides/coding_agents and `/guides/anthropic_api`, 2026-09-29). The
  Anthropic-format endpoint ignores `cache_control` and `budget_tokens` and does not support MCP tools.
- F15 `verified-doc` Anthropic "doesn't support routing Claude Code to non-Claude models through any
  gateway" (https://code.claude.com/docs/en/llm-gateway, 2026-09-29). `inferred` from F14 and F15: a
  DeepSeek critic must be called by Specstride's runtime over HTTP, not by pointing `claude -p` at
  DeepSeek's endpoint. That is also what Principle IX prefers. Whether the second route is permitted at
  all is R8's question.

### Host and gateway facts

- F16 `verified-doc` Claude Code can query a gateway's `/v1/models` at startup, only when
  `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1`; it sends `GET /v1/models?limit=1000` with a 3 s
  timeout, treats any redirect as failure "so the credential can't leak to a redirect target", reads
  `id`, `display_name`, `description`, and keeps only ids containing `claude` or `anthropic`
  (https://code.claude.com/docs/en/llm-gateway-protocol, 2026-09-29). `inferred`: the host's own picker
  will never surface a DeepSeek model, so rung 2 of the critic order (a second model through the host
  gateway) needs Specstride's own query of the gateway.
- F17 `verified-doc` For an unrecognized model id Claude Code assumes a 200K window unless told
  otherwise (same page). `inferred`: even the host treats the window of an unknown model as something
  that must be declared.
- F18 `verified-doc` The Claude API `GET /v1/models` returns `max_input_tokens`, `max_tokens` and a
  `capabilities` object per model (https://platform.claude.com/docs/en/api/models/list, 2026-09-29).
- F19 `verified-doc` OpenRouter `GET /api/v1/models` returns `context_length`, `pricing`,
  `top_provider.max_completion_tokens`, `supported_parameters`
  (https://openrouter.ai/docs/api/api-reference/models/get-models, 2026-09-29). The summary said a key
  is required; R6 owns that row.
- F20 `verified-doc` LiteLLM proxy `/health` "runs a real test request against every configured model,
  so it costs a few tokens per model"; `/health/readiness` and `/health/liveliness` make no model call
  (https://docs.litellm.ai/docs/proxy/health, 2026-09-29). `/model/info` returns cost and context data,
  needs a key and does not call the model (https://docs.litellm.ai/docs/proxy/model_management).
- F21 `verified-doc` Claude Code MCP servers live in `.mcp.json` (project scope) and `~/.claude.json`
  (user and local scope); entries carry `command`, `args`, `env` or `type`, `url`, `headers`
  (https://code.claude.com/docs/en/mcp, 2026-09-29). `inferred`: `env` and `headers` can hold secrets,
  so only names and types are safe to read, and `~/.claude.json` is not read at all.
  `unverified`: whether `claude mcp list` connects to servers; the fetched summary contradicted itself,
  and the command was not run because it may start processes. Discovery does not call it.
- F22 `verified-doc` Claude Code subagents are files in `.claude/agents/`, `~/.claude/agents/` or a
  plugin's `agents/`; the `model` field takes `sonnet`, `opus`, `haiku`, `fable`, a full model id or
  `inherit` (https://code.claude.com/docs/en/sub-agents, 2026-09-29). `inferred`: a host subagent is
  always served by the host's model route, so it is not a second provider. It can inform rung 4 (Claude
  on a different tier) and nothing else.
- F23 `inferred` An MCP server is not a harness. It exposes tools to the host's model; it has no
  headless prompt-in, text-out contract, and calling it needs a live host session, which the detached
  runtime does not have (decision 5). From F21 and decision 5. It is recorded as a possible future
  descriptor `kind`, not implemented in v1.

### Prior-art facts

- F24 `verified-doc` opencode "uses the AI SDK and Models.dev to support 75+ LLM providers"; keys added
  with `/connect` go to `~/.local/share/opencode/auth.json`; a custom provider is a `provider` entry
  with `npm: "@ai-sdk/openai-compatible"`, `options.baseURL` and `models.<id>.limit.context|output`
  (https://opencode.ai/docs/providers/, 2026-09-29). `opencode models [provider] --verbose` prints
  metadata including costs; `OPENCODE_DISABLE_MODELS_FETCH` and `OPENCODE_MODELS_URL` control the
  catalogue fetch (https://opencode.ai/docs/cli/, 2026-09-29). Specstride never opens that `auth.json`.
- F25 `verified-doc` models.dev is an MIT-licensed database with `https://models.dev/api.json`; per
  model it has `cost.*`, `limit.context|input|output`, `tool_call`, `reasoning`, `structured_output`;
  per provider `npm`, `env`, `doc`, optional `api` (https://github.com/anomalyco/models.dev,
  2026-09-29).
- F26 `verified-doc` LiteLLM keeps a community-maintained
  `model_prices_and_context_window.json`; `LITELLM_LOCAL_MODEL_COST_MAP=True` uses the local copy
  (https://docs.litellm.ai/docs/completion/token_usage, 2026-09-29). Any compatible endpoint is reached
  with the `openai/` prefix plus `api_base` (https://docs.litellm.ai/docs/providers/openai_compatible).
  `validate_environment` and `get_valid_models(check_provider_endpoint=True)` are the discovery helpers
  (https://docs.litellm.ai/docs/set_keys).
- F27 `verified-doc` ACP: `initialize` returns `protocolVersion`, `agentCapabilities` (`loadSession`,
  `promptCapabilities`, `mcpCapabilities`), `agentInfo`, `authMethods`
  (https://agentclientprotocol.com/protocol/initialization, 2026-09-29). A registry is published at
  `https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json`, with an `agent.json` manifest
  per agent (https://agentclientprotocol.com/get-started/registry, 2026-09-29).
- F28 `verified-doc` VS Code: `vscode.lm.selectChatModels` with `vendor`, `id`, `family`, `version`;
  models expose `maxInputTokens` and `countTokens`; Copilot models need user consent
  (https://code.visualstudio.com/api/extension-guides/ai/language-model, 2026-09-29).

### Descriptor schema v1

`inferred` from F1-F8, F10-F13, F24-F27. Design rules: data only; argv arrays, never shell strings;
every capability is `declared`, `probed` or absent; unknown is `null`; unknown top-level keys are
rejected, unknown keys under `x-` are ignored, so a newer descriptor fails loudly on an older runtime
instead of half-working.

```yaml
descriptorVersion: 1              # integer; the runtime states the range it accepts
id: deepseek-api                  # [a-z][a-z0-9-]*; unique in the resolved registry
displayName: DeepSeek API
kind: openai-chat                 # cli | openai-chat | anthropic-messages   (open set, see below)
provider:
  id: deepseek                    # identity used for the diversity test and for R8's terms lookup
  termsRef: null                  # R8 row id; null = unknown terms -> Tier 1/2 only + doctor warning
origin: bundled                   # set by the loader: adapter | bundled | user | detected

detect:                           # how presence is established, free of charge
  env: [DEEPSEEK_API_KEY]         # presence only
  # cli kinds use:  binary: dsh ; version: {args: ["--version"], pattern: "^(\\d+\\.\\d+\\.\\d+\\S*)"}
  #                 help: {args: ["--help"]} ; configHome: {env: DSH_HOME, default: "~/.dsh"}

auth:
  tiers: [2]                      # 1 = own CLI login, 2 = key/SDK. 3 is never valid on a descriptor
  credential: "env:DEEPSEEK_API_KEY"   # env: | file: | keychain:  (decision 6)
  scheme: bearer                  # bearer | x-api-key | none
  preflight:
    method: GET
    path: /models                 # never a POST; redirects refused
    authFailure: [401]

endpoint:                         # endpoint kinds only
  baseUrl: https://api.deepseek.com
  chatPath: /chat/completions
  modelsPath: /models

models:
  default: deepseek-flash
  list: probe                     # probe | declared
  contextWindow:
    source: probe                 # declared | probe | catalogue
    field: context_window         # field of a modelsPath entry
    tokens: null                  # filled when source = declared
  maxOutputTokens: {source: probe, field: max_output_tokens}

roles:
  proposer: {supported: false, reason: "no tool loop of its own"}
  critic:
    supported: true
    toolless: structural          # structural | flag | config | none
    freshSession: structural

stream:
  format: sse-openai              # text | jsonl | sse-openai | sse-anthropic | <named tested format>
  tolerate: [blank-lines, sse-comments]
  usage: {input: usage.prompt_tokens, output: usage.completion_tokens,
          cacheRead: usage.prompt_tokens_details.cached_tokens}

continuation: {supported: false}

failures:                         # maps onto the typed failure vocabulary
  authentication_failed: {http: [401]}
  rate_limited:          {http: [429]}
  quota_exhausted:       {http: [402]}
  transport_failed:      {http: [500, 503]}
  context_window_exceeded: {bodyPattern: "context|maximum.*tokens"}

cost:
  class: metered                  # subscription | metered | local | unknown
  usdPerMTok: {input: 0.30, output: 1.20, asOf: "2026-09-29"}   # null when unknown; never guessed

isolation:
  envAllow: [DEEPSEEK_API_KEY]    # the only variables handed to the call
```

The same provider as an Anthropic-compatible endpoint differs only in these keys:

```yaml
id: deepseek-anthropic
kind: anthropic-messages
auth: {tiers: [2], credential: "env:DEEPSEEK_API_KEY", scheme: x-api-key,
       preflight: {method: GET, baseUrl: https://api.deepseek.com, path: /models, authFailure: [401]}}
endpoint: {baseUrl: https://api.deepseek.com/anthropic, chatPath: /v1/messages}
stream: {format: sse-anthropic, tolerate: [blank-lines, sse-comments]}
```

The CLI shape, with `dsh` as reached in Wave 1 before its tested adapter exists:

```yaml
descriptorVersion: 1
id: dsh
displayName: DeepSeek Harness
kind: cli
provider: {id: deepseek, termsRef: null}
detect:
  binary: dsh
  binaryEnv: SPECSTRIDE_DSH_BIN
  version: {args: ["--version"], pattern: "^(\\S+)"}
  help: {args: ["--help"], mustContain: ["--profile", "--patch"]}
  configHome: {env: DSH_HOME, default: "~/.dsh"}       # stat only
auth: {tiers: [1, 2], credential: null, preflight: none} # harness owns its login; doctor warns
invoke:
  proposer:
    argv: [dsh, --profile, headless, "{prompt}"]
    prompt: {via: argv, maxBytes: 120000}                # argv-only, so bounded (Principle VIII)
    cwd: "{workdir}"
    env: {DSH_PERMISSION_MODE: workspace-write}
    permission: {mechanism: env, declared: true}
  critic:
    argv: [dsh, --profile, headless, --patch, "{file:toolsOff}", "{prompt}"]
    prompt: {via: argv, maxBytes: 120000}
    cwd: "{emptyTmp}"
    files:
      toolsOff: {format: yaml, content: [{id: tool-bash, disabled: true}, {id: tool-fs, disabled: true}]}
models:
  select: {mechanism: none}                              # a tested adapter does the settings overlay
  contextWindow: {source: declared, tokens: null}        # unknown -> not eligible for auto-pick
roles:
  proposer: {supported: true}
  critic: {supported: true, toolless: config, freshSession: structural}
stream: {format: text}                                   # init and terminal are synthesized
continuation: {supported: false}                         # `--resume` exists; not claimed until tested
failures: {}
cost: {class: unknown}
isolation:
  envAllow: [DSH_HOME, DSH_PERMISSION_MODE, HOME, PATH]
  configHome: {vars: [DSH_HOME], seeds: []}
```

Placeholders are a closed set: `{prompt}`, `{promptFile}`, `{workdir}`, `{emptyTmp}`, `{model}`,
`{sessionId}`, `{file:<name>}`. `kind` and `stream.format` are open sets resolved through the adapter
seam, so a new kind (for example `acp`) is a new reader package, not a core change.

The tool list in the `dsh` example is shortened; `critic.py` line 2093 onward disables many more tool
ids, and the list changes with dsh releases. This is the reason F29 exists.

- F29 `inferred` A CLI's tool-less mode cannot be proven without running the model, and a deny-list of
  tool ids goes stale when the harness adds a tool. From `critic.py` `call_dsh_shell` and R7's and R10's
  findings that Copilot's and opencode's zero-tool modes are unproven. Therefore **an unverified `cli`
  harness is never auto-picked as critic**; only endpoint kinds, whose tool-lessness is structural, and
  tested CLI adapters are eligible. A consumer may still configure an unverified CLI as critic
  explicitly, and gets the warning.

### Auto-pick rule

`inferred` from decisions 7, 8, 9, 17, 22 and 23, F3, F4, F16, F29.

**Order (decision 17, unchanged).**

1. The critic the consumer configured. Discovery never overrides it.
2. A second model through the host gateway.
3. A qualifying discovered harness, tested before unverified.
4. Claude on a different model tier, fresh session, no tools, set budget.

**Qualification for rungs 2 and 3 (all must hold).**

| Id | Condition |
|---|---|
| Q1 | `roles.critic.supported` and C1-C6 |
| Q2 | Tool-less is `structural`, or the harness is a tested adapter (F29) |
| Q3 | Context window known, from a declared, probed, adapter-table or catalogue source, and large enough for the critic's minimum grounding budget |
| Q4 | Provider id or model id differs from the proposer's. Identity is the descriptor's `provider.id` and the model id sent, not the wire protocol: DeepSeek behind an Anthropic-format URL is still `deepseek`. A gateway alias whose real model is unknown counts as "diversity unverified": eligible, with a warning. |
| Q5 | Credential present, and the free preflight did not return an auth failure |
| Q6 | Tier 1 or 2; unknown terms allowed with a doctor warning; a provider R8 marks as not permitted is excluded |
| Q7 | Not known to be out of quota at launch |
| Q8 | The critic role has a budget in force (decision 8); for `cost.class: metered` a hard cap is mandatory |

**Ranking inside rung 3.** Compare in this order and stop at the first difference:

1. State: tested, then locally-verified, then declared, then detected.
2. Cost class: `local` and `subscription` (no marginal money), then `metered` by ascending output price,
   then `unknown`.
3. Quota: no limit signal seen in the last window, before one seen.
4. Window: larger first.
5. Harness id, then model id, in byte order. This makes the result deterministic.

**Stability across resume.** The pick is a launch decision. It is written to the run's state with the
harness id, model id, descriptor hash, harness version, window and its source, rung, and the ranked list
of runners-up. A resume or relaunch reads that record and does not rank again (consistent with
`028 FR-016` replaying backends and with decision 23). It re-ranks only when the consumer passes an
explicit flag, or when the stored pick no longer exists. A changed harness version or descriptor hash is
a warning, not a re-pick.

**Failure of the picked critic mid-run.**

| Signal | Behaviour |
|---|---|
| Quota or rate limit (`rate_limited`, `quota_exhausted`) | Pause and resume at reset (decision 8); not a rejection. The consumer's opt-in fallback order, if any, applies. |
| Hard failure: auth failure, model not found, context overflow, or three consecutive transport failures | The pick is demoted for the rest of the run; the next entry of the stored ranked list is taken, and after the list, rung 4. The failed call produces no verdict and is not counted as a rejection or as MALFORMED. |
| MALFORMED verdict | Counted exactly as today. See Open questions for the unverified case. |
| Every rung failed | The run stops with the existing critic-error path; no new exit code. |

Every demotion is announced, written as an event and shown in the digest. A configured critic (rung 1)
is never demoted automatically: its failure follows decision 8 only.

**Announce, record, disable.**

- Announced: one launch line naming harness, model, rung, state and window source.
- Recorded: a launch event and the digest, with the runners-up.
- Shown: the doctor prints the pick it *would* make, and why each other candidate lost or failed
  qualification.
- Disabled: a config key, an env variable and a CLI flag (decision 9 order). Proposed names
  `critic.autoPick: false`, `SPECSTRIDE_CRITIC_AUTOPICK=0`, `--no-critic-autopick`; R16 owns the final
  names. With auto-pick off, rungs 2 and 3 are skipped and rung 4 applies.

## Version/date pins

| Item | Pin | Verified on |
|---|---|---|
| Specstride baseline | `9cab15d` | 2026-09-29, local |
| Lisa tree read | local `main` `363e6a3`; `packages/agents` sources identical to `76adfdc` | 2026-09-29, local |
| `claude` | 2.1.284 (A1) | 2026-09-29, local `--help` |
| `dsh` | 0.1.0-rc.8 | 2026-09-29, local `--version` |
| `pi`, `codex` | installed; versions per A1 (0.80.6, 0.153.4) | 2026-09-29, local `--help` |
| DeepSeek API | models `deepseek-flash`, `deepseek-v4-pro`; window 1048576 | 2026-09-29, docs |
| Agent Client Protocol | `protocolVersion` 1; registry `v1` | 2026-09-29, docs |
| Claude Code gateway discovery | documented for v2.1.248 and later (both credential headers) | 2026-09-29, docs |
| Descriptor schema | `descriptorVersion: 1` (proposed) | this report |
| models.dev, LiteLLM JSON | unversioned; snapshot must be dated when bundled | 2026-09-29, docs |

## Options compared

| Criterion | A. Closed registry (today) | B. Descriptor only | C. Delegate to a multiplexer (opencode or LiteLLM as the one route) | D. Three sources behind one port (decision 17) |
|---|---|---|---|---|
| New harness without a Specstride release | no | yes | only what the multiplexer supports | yes |
| Handles harness quirks (settings overlay, structured stream, quota text) | yes, in code | poorly; the descriptor grows into a language | partly | yes: code adapter where needed, data elsewhere |
| Proposer support | yes | yes (P1-P6) | opencode: API-key providers only (R10) ; LiteLLM: none, it has no tool loop | yes |
| Tool-less critic | yes | yes for endpoints | yes | yes |
| Known window | hand table | declared or probed | catalogue | all sources, with provenance |
| Extra runtime dependency | none | none | a second product to install, pin and trust | none |
| Subscription quota (Tier 1) reachable | yes | yes | mostly no | yes |
| Evolvability | low | high | medium, tied to one vendor's roadmap | high |
| Cost | none | a schema to maintain and version | lowest code, highest coupling | two mechanisms to test |

C contradicts R10's finding that opencode should not be the universal proposer. B alone cannot express
today's dsh model selection, which writes a throwaway settings file (`proposer.sh`
`dsh_make_home_overlay`). D is what the owner decided; the comparison confirms it and shows its price:
the conformance suite must run against both code adapters and descriptors.

## Recommendation

Adopt option D with these fixed points. **Confidence: medium-high (0.75)** on the mechanism and schema
shape; **medium (0.6)** on the mid-run demotion rule, which has no run evidence behind it yet.

1. One `HarnessPort` with two capability levels, `proposer` and `completion`, taken from Lisa's
   `AgentProvider`. A tested adapter is a descriptor plus optional code hooks; the generic adapter is the
   same port driven by the descriptor alone. The core sees only the port.
2. One resolved registry per launch, built from seven sources (S1-S7), written to run state, with each
   value's provenance (`declared`, `probed`, `catalogue`, `adapter`).
3. Descriptor schema v1 as above: three kinds in Wave 1 (`cli`, `openai-chat`, `anthropic-messages`),
   open sets for `kind` and `stream.format`. Ship a small set of bundled descriptors as data.
4. Discovery executes only what a descriptor names, reads presence and never values, and makes GET
   requests only. It never calls LiteLLM `/health`, never reads `~/.claude.json`, never opens a
   credential store.
5. An unverified CLI is never auto-picked as critic; unverified endpoints are. Unknown window
   disqualifies. No default window.
6. The auto-pick rule as specified, with the pick stored at launch and replayed on resume.
7. Promotion by an opt-in, budget-capped `harness verify`, and to `tested` only through a shipped
   adapter with fixtures, version range and a terms row.
8. MCP servers and host subagents are reported by the doctor and are not harness sources in v1.

Cost of the recommendation, stated as the brief asks: a schema that must be versioned and kept small,
and a conformance suite that every adapter and descriptor must pass. The gain is that Wave 1, which
ships one tested adapter, can still use every harness the consumer has.

## Matrix rows

| harness | tested or unverified | detect/version command | headless invocation | stream format | TS SDK | auth modes | tier | proposer? | tool-less critic? | quota signal | terms status | version pin + verified-on | delivery wave |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Generic discovered harness** (any agent CLI or model endpoint without a tested adapter) | unverified (sub-state detected, declared or locally-verified) | From descriptor: `command -v <binary>` plus declared version argv; endpoints: credential-variable presence plus `GET <modelsPath>` | From descriptor: argv array with prompt by stdin, file or bounded argv; endpoints: `POST <chatPath>` | Declared: `text`, `jsonl`, `sse-openai` or `sse-anthropic`; init and terminal synthesized when absent; unknown fields `null` | none required; endpoints use `fetch` | As declared: own CLI login, or key by `env:`/`file:`/keychain reference | 1 or 2 only; 3 refused | yes if P1-P6 hold | endpoints: yes when window known; CLI: only when configured by the consumer, never auto-picked | Declared map of HTTP status or exit code to `rate_limited`/`quota_exhausted`; otherwise unknown and the doctor says so | unknown unless R8 has a row: Tiers 1-2 with a doctor warning | none (no pin); local verification records version and date | Wave 1, with the adapter seam |
| DeepSeek API, OpenAI format (worked example) | unverified (docs only, no calls) | presence of `DEEPSEEK_API_KEY`; `GET https://api.deepseek.com/models` | `POST https://api.deepseek.com/chat/completions` | `sse-openai`; blank lines and `: keep-alive` comments | none needed | API key (Bearer) | 2 | no (no tool loop) | yes; window 1048576 from `/models` | 429 rate limit, 402 balance | see R8 (no row known: unknown terms) | models `deepseek-flash`, `deepseek-v4-pro`; 2026-09-29 | Wave 1 via generic descriptor |
| DeepSeek API, Anthropic format (worked example) | unverified (docs only) | as above | `POST https://api.deepseek.com/anthropic/v1/messages` | `sse-anthropic` | none needed | API key | 2 | no directly; through a harness only, and see F15 | yes | 429, 402 | see R8 | 2026-09-29 | Wave 1 via generic descriptor |
| dsh through the generic adapter (worked example; tested row is R9's) | unverified until R9's adapter ships | `command -v dsh`; `dsh --version` (0.1.0-rc.8 here) | `dsh --profile headless "<task>"` | `text` | none used | harness-owned | 1 or 2 | yes | only when configured; tool-less by patch file, unproven | unknown | see R8 | none | Wave 1 generic; tested adapter later |

## Open questions / risks

1. **DECISIONS-PENDING: the worked example names a harness that is also on the tested list.**
   Evidence: F9. Default taken: "a DeepSeek harness" is read as any DeepSeek-backed agent without a
   tested adapter; `dsh` keeps its place on the tested list and is reached through the generic adapter
   until its adapter ships. If the owner meant `dsh` itself, nothing in the design changes; only the
   example rows do.
2. **DECISIONS-PENDING: auto-pick can spend real money the consumer never configured.** Evidence: an
   endpoint found only because a key is present in the environment is `metered` (F12), and decision 17
   turns auto-pick on by default. Default taken: the decision as written, made safe by Q8 (a hard cap on
   the critic role is mandatory for a metered pick) and the launch announcement. If the owner rules
   otherwise, the change is one qualification line: a metered endpoint needs a consumer-declared entry
   to be eligible.
3. **DECISIONS-PENDING: does sending a declared credential to a free `GET /models` fit "discovery reads
   nothing secret"?** Evidence: most providers need the key for the model list (F19, F20), and the
   window of a DeepSeek model is only knowable live that way (F11). Default taken: allowed in the
   metadata pass, GET only, redirects refused, never logged. If ruled out, windows come from declaration
   or the catalogue only, and fewer harnesses qualify as critic.
4. **MALFORMED from a weak unverified critic.** An auto-picked model that cannot follow the nonce verdict
   format would exhaust the MALFORMED limit and stop the run. Options: leave as is; or demote an
   auto-picked unverified critic after its first MALFORMED while still counting it. No run evidence
   exists. For R15 and R23.
5. **Catalogue freshness.** A bundled snapshot goes stale; a live fetch is a network call at launch to a
   third party. Recommended: bundle a dated snapshot, refresh only on an explicit doctor command.
6. **Executing a consumer-supplied descriptor is executing consumer-supplied argv.** A descriptor in a
   project file could be planted by a repository. Recommended default: project-level descriptors need a
   one-time consumer confirmation; user-level ones do not. Threat analysis is R11's.
7. **`claude mcp list` side effects** and **`dsh --dump-config` content** are unverified (F7, F21).
   Discovery calls neither.
8. **Terms.** No terms row for DeepSeek was found in this effort's reports so far; by decision 17 it is
   unknown terms until R8 supplies one. F15 is passed to R8 and R5.
9. **Web evidence passed through a summarizing fetch tool.** Two values disagreed between pages of one
   provider (F12). A verifier should re-read the fields that the schema examples rely on.
10. **Context overflow must be a typed failure** (F3). This is a requirement on the event schema (R14)
    and on the critic (R5), noted here because discovery is where wrong windows enter.
