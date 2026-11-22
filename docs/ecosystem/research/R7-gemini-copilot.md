# R7 — Gemini CLI and GitHub Copilot CLI

Access date for every `verified-doc` claim: 2026-09-29. Neither CLI is installed here and none was run. Nothing in this report was measured.

Short forms for sources (all accessed 2026-09-29):

- G-HEAD = https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/headless.md (also https://geminicli.com/docs/cli/headless/)
- G-CLI = https://geminicli.com/docs/cli/cli-reference/
- G-CFG = https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md
- G-POL = https://geminicli.com/docs/reference/policy-engine/
- G-AUTH = https://geminicli.com/docs/get-started/authentication/
- G-QUOTA = https://geminicli.com/docs/resources/quota-and-pricing/
- G-MODEL = https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/model.md
- G-SESS = https://geminicli.com/docs/cli/session-management/
- G-SRC = source under https://github.com/google-gemini/gemini-cli/tree/main/packages (raw files read)
- C-PROG = https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference (source: https://github.com/github/docs/blob/main/content/copilot/reference/copilot-cli-reference/cli-programmatic-reference.md)
- C-CMD = https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference (source: .../cli-command-reference.md in github/docs)
- C-CTX = https://docs.github.com/en/copilot/concepts/agents/copilot-cli/context-management
- C-CHG = https://raw.githubusercontent.com/github/copilot-cli/main/changelog.md
- C-SDK = https://github.com/github/copilot-sdk/blob/main/nodejs/README.md
- NPM = https://registry.npmjs.org/<package> (public metadata)

## Prior art consulted

- `/root/specstride-claude/docs/ecosystem/research/BRIEF-COMMON.md` (all).
- `/root/specstride-claude/prompts/specstride-ecosystem.md` §0, §1, §2 (decisions 6, 7, 8, 10, 13, 17), §4 row R7 (line 337).
- `/root/specstride/lib/backends.py` at commit `9cab15d`, read via `git show` (read-only).
- Not consulted: `prompts/analysis/A1` (not needed; its scope is what is installed, and I checked directly).
- Nothing reused or contradicted from prior local research. Both harnesses are new ground for the ecosystem.

## Questions answered

### Q0. Does today's Specstride register either?

No. `verified-local`: `git show 9cab15d:lib/backends.py` lines 52-60 define `REGISTRY` with five entries: dsh, claude, codex, a locally registered backend, prime. Neither `gemini` nor `copilot` appears. The only occurrences of "gemini" in the tree at `9cab15d` are test fixtures that use it as a name that is deliberately unregistered: `lib/test_backend_registry.py:54-56` (asserts `spelling("gemini","proposer")` raises `KeyError`), `:83-87` (builds a synthetic `Backend("gemini", ...)` to test the "required" qualifier spelling), `:209-211`, `:448`, `:475-477`, `:649-654` (drift-detection tests). "copilot" appears nowhere in `lib`. Under decision 17 both are therefore reached only through a new tested adapter or a generic descriptor. The registry entry shape (name plus per-role qualifier, optional `stream` field, `backends.py:37-45`) already has a `stream` slot, which suggests the stream format name for each is a natural registry attribute (`inferred`).

### Q1. Headless / non-interactive mode

- Gemini: headless when run in a non-TTY environment or when a query is given with `-p/--prompt`. `-p` "Forces non-interactive mode" and is appended to stdin if stdin is provided. `verified-doc` (G-HEAD, G-CLI).
- Copilot: `-p PROMPT` / `--prompt` "Execute a prompt in non-interactive mode. The CLI runs the prompt and exits when done." Piped prompts also accepted. `-s/--silent` suppresses stats and decoration. `verified-doc` (C-PROG, C-CMD line 628).
- Copilot `-p` waits for pending background agents or shell commands up to `COPILOT_TASK_WAIT_TIMEOUT_SECONDS` (default 600). `verified-doc` (C-CMD line 815). This matters for a runtime that enforces its own time cap.

### Q2. Output formats

- Gemini: `-o/--output-format` accepts `text`, `json`, `stream-json`. `json` returns one object `{response, stats, error?}`. `stream-json` returns JSONL with event types `init` (session ID, model), `message`, `tool_use`, `tool_result`, `error` (non-fatal), `result` (aggregated stats and per-model token usage). `verified-doc` (G-HEAD, G-CLI). Exit codes: 0 success, 1 general/API failure, 42 input error, 53 turn limit exceeded. `verified-doc` (G-HEAD). Event type names are also present in source (`JsonStreamEventType.INIT/MESSAGE/TOOL_USE/TOOL_RESULT/ERROR/RESULT` used in `packages/cli/src/nonInteractiveCli.ts` lines 255-596). `verified-doc` (G-SRC, raw source read 2026-09-29). Field-level schema of each event: `unverified` (only the type list is documented; source not traced).
- Copilot: `--output-format=text|json`; `json` emits JSONL, one object per line. `verified-doc` (C-PROG, C-CMD line 627). The JSONL event schema, exit codes for `-p`, error reporting format and rate-limit handling are not documented in the programmatic reference. `unverified` (tried: C-PROG, C-CMD, grep for "exit code" and "rate limit"). Only `copilot workflow run` has documented exit codes (0, 1, 130), which is a different command. `verified-doc` (C-CMD line 171). The typed event names exposed by the SDK (`assistant.message`, `assistant.message_delta`, `session.idle`) are documented in C-SDK, and are probably the same events as the JSONL stream (`inferred`, not confirmed).

### Q3. Auth options

- Gemini (`verified-doc`, G-AUTH): (1) Sign in with Google (interactive browser, individual and organization accounts, credentials cached locally); (2) `GEMINI_API_KEY` from AI Studio, non-interactive; (3) Vertex AI via Application Default Credentials, service-account JSON (`GOOGLE_APPLICATION_CREDENTIALS`), or Google Cloud API key (`GOOGLE_API_KEY`), plus `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_PROJECT_ID` / `GOOGLE_CLOUD_LOCATION`. Headless "will use your existing authentication method, if an existing authentication credential is cached"; otherwise env vars are required. The cached-credential path is not documented (`unverified`; deliberately not looked for on disk). `.env` files are auto-loaded from the cwd upward then `~/.gemini/.env`, first file found wins. Enterprise: Workspace and Gemini Code Assist Standard/Enterprise licences sign in with Google (G-QUOTA); Vertex AI is the enterprise pay-as-you-go path.
- Copilot (`verified-doc`, C-CMD lines 41-46 and login section): `copilot login` (web flow on a local terminal, OAuth device-code flow on remote/CI, `--with-token` reads a token from stdin, `--host` for GHE.com data-residency hosts). Token stored in the system credential store, or in plaintext under `~/.copilot/` (or `$COPILOT_HOME`) when no store exists. Env tokens checked in order `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, "most suitable for headless use". Supported token types: fine-grained PAT (v2) with the "Copilot Requests" permission, and OAuth tokens from the Copilot CLI app or the `gh` app (from the first fetch of C-CMD; the current page text was re-read only in part, so treat the exact list as `verified-doc` from a summarised fetch). An active Copilot subscription is required (https://raw.githubusercontent.com/github/copilot-cli/main/README.md). Tiers and terms: see R8.
- Mapping to decision 6: Gemini and Copilot both fit Tier 1 (logged-in CLI) and both have a documented Tier 2 (API key / token in env: `GEMINI_API_KEY` or Vertex; `COPILOT_GITHUB_TOKEN`). Copilot's "API key" is a GitHub token bound to a subscription, so it is not pay-per-token in the way Gemini's key is (`inferred` from the credit-based billing text in C-CTX-adjacent pages and the README). Terms status for both: see R8.

### Q4. Tool-permission flags, and can tools be fully disabled for critic use?

Gemini (`verified-doc`):
- `--approval-mode default|auto_edit|yolo|plan` (`--yolo` deprecated); `plan` is read-only. `--allowed-tools` is deprecated in favour of the Policy Engine (G-CLI).
- Policy Engine: TOML files in `~/.gemini/policies/*.toml` with `[[rule]] toolName, decision = allow|deny|ask_user, priority`. A rule `toolName = "*"`, `decision = "deny"`, `priority = 999` denies all tools; for global deny rules (no `argsPattern`) the denied tools are "completely excluded from the model's memory", meaning the model never sees them. In headless mode `ask_user` is treated as `deny` (G-POL).
- Also `tools.core` (allowlist of built-ins), `tools.exclude`, `tools.allowed`, `mcpServers` and `--allowed-mcp-server-names` (G-CFG, G-CLI).
- Verdict: a tool-less critic is documented as achievable, by policy file, not by a single flag. A per-run policy needs a policy directory the run controls. The doc mentions `--admin-policy` for supplemental policies but no ordinary `--policy` flag (G-POL); how to inject a run-local policy without touching `~/.gemini` is `unverified`. Setting `GEMINI_CLI_HOME` to a throwaway directory (G-CFG) would allow it (`inferred`). Sub-agents ignore `--model` (G-MODEL note), so sub-agent tool exposure with the deny-all rule must be probed (`unverified`).

Copilot (`verified-doc`, C-PROG, C-CMD lines 571-645, 715+):
- `--allow-tool`, `--deny-tool` (deny wins over allow), `--available-tools` ("Only these tools will be available to the model"), `--excluded-tools`, `--allow-all-tools`, `--allow-all` / `--yolo`, `--allow-all-paths`, `--allow-all-urls`, `--allow-url`, `--deny-url`, `--no-ask-user`, `--disable-builtin-mcps`, `--disable-mcp-server`, `--no-custom-instructions`, `--secret-env-vars`.
- Tool kinds: shell, write, read, url, memory, MCP-SERVER, with filters such as `shell(git:*)`. Named tool values (`bash`, `view`, `edit`, `create`, `apply_patch`, agent/task tools, and so on) are listed under "Tool availability values".
- The programmatic reference documents no mode that runs the model with zero tools (`unverified`; tried: C-PROG, C-CMD, grep for "no tools", "empty"). Whether `--available-tools` with an empty or non-matching list yields a tool-less run is untested. A strict emulation is `--excluded-tools` over every built-in name, `--disable-builtin-mcps`, `--no-custom-instructions`, `--no-ask-user`. That is `inferred` to work and needs a probe. Copilot also injects its own system prompt, agent and memory features that cannot obviously be removed.
- Verdict: tool-less critic is not documented for Copilot CLI. Treat it as "restricted-tool critic, probe required".

### Q5. Session resume

- Gemini: `-r/--resume` with `latest`, an index, or a session UUID; `--list-sessions`, `--delete-session`. Sessions live in `~/.gemini/tmp/<project_hash>/chats/` and are project-scoped; default retention 30 days; `maxSessionTurns` limits growth and "non-interactive mode exits with errors" when hit. `verified-doc` (G-SESS, G-CLI). The `init` event carries a session ID (G-HEAD), so a runtime can capture it and resume by UUID (`inferred`). Whether `-p` combined with `--resume <uuid>` works headlessly: `unverified`.
- Copilot: `--continue` (most recent session in the cwd), `-r/--resume[=VALUE]` (session ID, prefix, or name), `--session-id ID` (exact resume, creates a new session when the value is a valid UUID and nothing matches), `-n/--name`. Under `-p`, a bare `--resume` errors out when the picker cannot be shown; pass an explicit ID. The `-p` exit summary prints a `copilot --resume=SESSION-ID` hint. `verified-doc` (C-CMD lines 593, 617, 628, 634, 638). Because `--session-id` accepts a caller-chosen UUID, a runtime can name sessions itself, which suits decision 22 (`inferred`). The critic never resumes (decision 22), so this matters for proposers only.

### Q6. How quota and rate limits surface

- Gemini: per-auth-type daily request quotas (see Findings) and per-minute limits "subject to availability" (G-QUOTA). The docs do not say how exhaustion surfaces (G-QUOTA fetch: no 429 detail). Source shows two typed errors, `TerminalQuotaError` and `RetryableQuotaError`, both carrying `retryDelayMs`, distinguished by a maximum retryable delay (`packages/core/src/utils/googleQuotaErrors.ts` lines 28-75, 279-289). `verified-doc` (G-SRC). So a Google-issued retry delay is available to the CLI; whether it reaches the caller in the JSON `error` object or exit code 1 is `unverified`. Users report inconsistent 429s across login and API-key quota pools (issues #24396, #22635; search results only, `unverified` as to cause).
- Copilot: premium-request / AI-credit billing. Interactive and programmatic use consume "AI credits ... based on the number of tokens processed" (https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-copilot-cli). `--max-ai-credits=N` is a soft per-response cap; session limits are in public preview with a 30-credit minimum (C-CMD line 612; https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/set-session-limit). How an exhausted plan or a rate limit appears under `-p` (exit code, JSONL error event): `unverified`. R14 owns the quota design; this report supplies only the signals.

### Q7. Config home

- Gemini: `~/.gemini`, override with `GEMINI_CLI_HOME`; `settings.json` precedence defaults < `/etc/gemini-cli/system-defaults.json` < user `~/.gemini/settings.json` < project `.gemini/settings.json` < `/etc/gemini-cli/settings.json` < env < CLI args. `verified-doc` (G-CFG).
- Copilot: `~/.copilot`, override with `COPILOT_HOME` (`--config-dir` deprecated); user settings in `settings.json`, repo settings in `.github/copilot/settings.json` and `settings.local.json`; logs in `~/.copilot/logs/` (`--log-dir`). `verified-doc` (C-PROG, C-CMD lines 123, 610, 528).
- Both support a throwaway config home for Principle VIII by pointing the variable at a temp dir (`inferred`). The tension is auth: an OAuth login lives in the real home (Gemini: cache path undocumented; Copilot: system credential store, else `~/.copilot`), so a throwaway home loses the login unless a token is supplied through env (`COPILOT_GITHUB_TOKEN`, `GEMINI_API_KEY`). This makes the known Tier 1 vs Principle VIII tension concrete for both (`inferred`).

### Q8. TS SDK

- Gemini: `packages/sdk` in the repo defines `@google/gemini-cli-sdk` (`GeminiCliAgent`, `sendStream`), Apache-2.0, version `0.63.0-nightly.20260923...`. `verified-doc` (https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/sdk/README.md). It is not published to npm: the registry returns "Not found" for `@google/gemini-cli-sdk`. `verified-local` on this machine's network: `curl https://registry.npmjs.org/@google%2fgemini-cli-sdk` gave `{"error":"Not found"}`. `@google/gemini-cli-core` is published (latest 0.61.0) but is an internal package with no stability promise (`inferred`).
- Copilot: `@github/copilot-sdk` 1.0.15 (npm `latest`, 2026-09-28), MIT, "TypeScript SDK for programmatic control of GitHub Copilot CLI via JSON-RPC". Node `^20.19.0 || >=22.12.0`. It bundles the CLI runtime in optional per-platform packages (`COPILOT_CLI_PATH` overrides). Client options include `baseDirectory` (sets `COPILOT_HOME`), `gitHubToken`, `useLoggedInUser`, `telemetry` (OpenTelemetry), `logLevel`. `createSession({model, onPermissionRequest, ...})`, `resumeSession(id, config)`, session config `availableTools`/`excludedTools`, `systemMessage`, `infiniteSessions`. `verified-doc` (C-SDK; NPM `@github/copilot-sdk`). Six-language SDK family (Node, Python, Go, .NET, Java, Rust) per C-SDK. Relevant to decision 19: SDK is MIT but the CLI it drives is under GitHub Copilot CLI License (`LICENSE.md`), which allows redistribution only unmodified and only inside an application with material additional functionality, not standalone (https://raw.githubusercontent.com/github/copilot-cli/main/LICENSE.md). The npm `license` field of `@github/copilot` is "SEE LICENSE IN LICENSE.md" (NPM). Hand to R8.

### Q9. Default models and known context windows (decision 17)

- Gemini default: `--model` defaults to `auto` (G-CLI). Docs list Auto (Gemini 3) as `gemini-3-pro-preview` / `gemini-3-flash-preview`, and Auto (Gemini 2.5) as `gemini-2.5-pro` / `gemini-2.5-flash` (G-MODEL). Source at `main` has `DEFAULT_GEMINI_MODEL = 'gemini-2.5-pro'`, `PREVIEW_GEMINI_MODEL = 'gemini-3-pro-preview'`, `PREVIEW_GEMINI_3_1_MODEL = 'gemini-3.1-pro-preview'`, `BASE_GEMINI_FLASH_MODEL = 'gemini-3.5-flash'`, `LATEST_GEMINI_FLASH_MODEL = 'gemini-3.8-flash'` (`packages/core/src/config/models.ts` lines 59-82). `verified-doc` (G-SRC). The Gemini API models page lists `gemini-3-pro-preview` and `gemini-3-flash-preview` as shut down and 3.5 to 3.8 flash as stable (https://ai.google.dev/gemini-api/docs/models, summarised fetch). The CLI docs are therefore out of date relative to the API, and the effective "auto" pair is not stable. A critic must pin an explicit model.
- Gemini context windows (`verified-doc`): `gemini-3.8-flash` input 1,048,576, output 65,536 (https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash); `gemini-3.1-pro-preview` input 1,048,576, output 65,536, status Preview (https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview). The CLI compresses history at `contextManagement.historyWindow.maxTokens` default 150,000 (G-CFG), so the usable budget for a critic is 150k unless raised. A critic's known budget should be min(model window, CLI compression threshold) (`inferred`). Qualifies for decision 17: yes, with an explicit model pin.
- Copilot default: `claude-sonnet-4.6` "General-purpose coding (default)"; `--model` or `COPILOT_MODEL` selects others (`gpt-5.4`, `gpt-5.3-codex`, `claude-opus-5.5`, `claude-haiku-4.5`, `gemini-3.5/3.6/3.7-flash`, opt-in `gpt-6-astra/sol/luna`); `auto` lets Copilot pick (C-CMD lines 692-708). `verified-doc`. The CLI changelog shows the model list is changing weekly (C-CHG 1.0.87-1.0.89).
- Copilot context window: "varies by model" (C-CTX line 20); "the latest models support a 1 million token context window", with `--context default|long_context` for tiered-pricing models (C-CMD line 591; about-copilot-cli page). The number for `claude-sonnet-4.6` or any specific model in the default tier is `unverified` (tried: C-CTX, C-CMD, about-copilot-cli, supported-models.md, grep "context"). Under decision 17 a harness needs a known window to qualify as a discovered critic, so Copilot does not qualify until the window per pinned model is verified or declared in the descriptor. Auto compaction starts at about 80% of the window (C-CTX line 67); tool output over 20 KiB is diverted to a file (C-CTX line 31).

### Q10. Version pins

See Version/date pins.

### Q11. Proposer, tool-less critic, or both?

- Gemini CLI: both. Proposer: `-p`, `--approval-mode` (yolo or auto_edit for writes), `stream-json`, session resume, exit codes give a machine-readable outcome. Critic: policy deny-all rule gives a documented tool-less mode, context window known. Caveats: run-local policy injection and sub-agents need a probe; quota exhaustion signalling needs a probe; default model must be pinned.
- Copilot CLI: proposer yes; critic conditionally. `-p`, JSONL, `--allow-all-tools`/`--deny-tool`, `--session-id`, `--max-ai-credits`, SDK with typed events. But no documented tool-less mode, no documented per-model context window, no documented JSONL schema or `-p` exit codes. Classify as proposer at first; critic after the probes listed under Open questions.
- Diversity value (decision 7): both CLIs can front models from different vendors. Copilot gives access to Claude, GPT and Gemini models under one login; a Copilot critic on a GPT model is a diverse critic for a Claude proposer without a second subscription (`inferred`). Gemini CLI is single-vendor (Google).

## Findings

Every claim below is `verified-doc` unless marked; access date 2026-09-29.

| # | Claim | Tag | Source |
|---|---|---|---|
| F1 | Neither `gemini` nor `copilot` is registered in `backends.py` at `9cab15d` | `verified-local` | `lib/backends.py:52-60`; `lib/test_backend_registry.py:54-56,83-87` |
| F2 | `gemini` not installed; no `copilot` CLI installed. A VS Code extension shim exists at `/root/.vscode-server/data/User/globalStorage/github.copilot-chat/copilotCli/copilot`; running it with `--version` printed "Cannot find GitHub Copilot CLI ... Install GitHub Copilot CLI? ['y/N']" and did not install anything. `gh copilot` is "unknown command" in the installed `gh` | `verified-local` | `command -v gemini copilot gh` returned only `/usr/bin/gh`; shim run output as quoted; `gh copilot --help` |
| F3 | Gemini headless: non-TTY or `-p`; formats `text`/`json`/`stream-json`; exit codes 0/1/42/53 | `verified-doc` | G-HEAD, G-CLI |
| F4 | Gemini quotas per user per day: Google login 1,000; Google AI Pro 1,500; Ultra 2,000; unpaid API key 250 (Flash only); Code Assist Standard 1,500; Enterprise 2,000; Workspace AI Ultra 2,000; Vertex Express 90 days | `verified-doc` | G-QUOTA |
| F5 | Gemini quota errors are typed in source with a retry delay (`TerminalQuotaError`, `RetryableQuotaError`) | `verified-doc` | `packages/core/src/utils/googleQuotaErrors.ts:28-75,279-289` |
| F6 | Gemini deny-all tools via policy TOML; denied tools are hidden from the model; `ask_user` becomes deny in headless | `verified-doc` | G-POL |
| F7 | Gemini SDK exists in-repo but is unpublished | `verified-doc` + `verified-local` (registry 404) | sdk README; npm registry query |
| F8 | Gemini sessions project-scoped in `~/.gemini/tmp/<hash>/chats/`; resume by latest/index/UUID | `verified-doc` | G-SESS |
| F9 | Copilot `-p`, `--output-format=json` (JSONL), full flag set for allow/deny/available/excluded tools | `verified-doc` | C-PROG, C-CMD |
| F10 | Copilot auth: login flows, `COPILOT_GITHUB_TOKEN` > `GH_TOKEN` > `GITHUB_TOKEN`, credential store or plaintext under `~/.copilot` | `verified-doc` | C-CMD |
| F11 | Copilot resume: `--continue`, `--resume[=ID/prefix/name]`, `--session-id` | `verified-doc` | C-CMD 593,634,638 |
| F12 | Copilot has a published TS SDK (`@github/copilot-sdk` 1.0.15, MIT) bundling the CLI runtime | `verified-doc` | C-SDK, NPM |
| F13 | Copilot CLI licence restricts standalone redistribution; only unmodified redistribution inside an application with material additional functionality | `verified-doc` | `github/copilot-cli` LICENSE.md. Terms status: see R8 |
| F14 | Copilot has no documented tool-less mode, no documented JSONL schema, no documented `-p` exit codes or rate-limit behaviour | `unverified` | tried C-PROG, C-CMD, about-copilot-cli, greps |
| F15 | Copilot default model `claude-sonnet-4.6`; per-model context window not stated for the default tier; 1M for "latest models" and `--context long_context` | `verified-doc` / `unverified` (default-tier number) | C-CMD 699, 591; about-copilot-cli |
| F16 | Gemini models `gemini-3.8-flash` and `gemini-3.1-pro-preview` have 1,048,576-token input windows; CLI compresses history at 150k by default | `verified-doc` | ai.google.dev model pages; G-CFG |
| F17 | Gemini CLI docs (Auto = `gemini-3-pro-preview`/`-flash-preview`) lag the API model list (those preview models marked shut down) | `verified-doc` (both sides) | G-MODEL vs https://ai.google.dev/gemini-api/docs/models |
| F18 | Gemini Auto pair and Copilot model list change on a weekly cadence; a model must be pinned in the adapter descriptor | `inferred` | release timestamps below; C-CHG entries 1.0.87 to 1.0.89 |
| F19 | Throwaway config home is possible for both (`GEMINI_CLI_HOME`, `COPILOT_HOME`) but loses OAuth login; env-token auth survives | `inferred` | G-CFG, C-PROG line 96, G-AUTH, C-CMD login section |

## Version/date pins

Proposed pins are for the adapter's tested range. Because neither CLI was run, both carry `verified-on` for the documentation only, and the adapter's own conformance tests must supply the tested date before release (decision 10).

| Harness | Latest at 2026-09-29 (NPM) | Proposed range | verified-on | Notes |
|---|---|---|---|---|
| Gemini CLI (`@google/gemini-cli`) | `latest` 0.61.0 (published 2026-09-24); `preview` 0.62.0-preview.0 (2026-09-23); `nightly` 0.63.0-nightly.20260928 | `>=0.61.0 <0.62.0` | 2026-09-29 (docs and source only, not executed) | Pre-1.0 with roughly weekly minors; keep the range to one minor. Licence Apache-2.0 (NPM). |
| GitHub Copilot CLI (`@github/copilot`) | `latest` 1.0.89 (2026-09-28); `prerelease` 1.0.90-0 | `>=1.0.89 <1.1.0` | 2026-09-29 (docs and changelog only, not executed) | Patch releases about weekly. `COPILOT_AUTO_UPDATE=false` / `--no-auto-update` should be set by the adapter (C-PROG env table, C-CMD line 619) so the pin holds. |
| `@github/copilot-sdk` | `latest` 1.0.15 (2026-09-28) | `>=1.0.15 <1.1.0` if the SDK route is chosen | 2026-09-29 | Ships its own CLI runtime version. |
| Detect/version command | `gemini --version`; `copilot --version` or `copilot version` (checks for updates, so prefer `--version`) | | | `copilot version` "check[s] for updates" (C-CMD), which is a network call; the doctor should use `--version`. `--version` for `gemini` is `inferred` (standard; not seen in the fetched pages). |

## Options compared

Adapter route for Copilot (Gemini has no published SDK, so the CLI subprocess is the only route today):

| Criterion | A. `copilot -p --output-format json` subprocess | B. `@github/copilot-sdk` (JSON-RPC to the bundled runtime) |
|---|---|---|
| Evolvability (generic descriptor, decision 17) | Best: same shape as every other CLI adapter | Needs a bespoke adapter, but typed events |
| Schema stability | JSONL schema undocumented (F14) | Typed events documented in C-SDK |
| Tool control | Flags | `availableTools`/`excludedTools` and permission callback `onPermissionRequest` (finer control) |
| Session control | `--session-id` | `createSession`/`resumeSession` |
| Distribution (decision 19) | No bundling; user installs CLI | SDK bundles runtime; licence conditions on redistribution (F13) |
| Context cost/complexity | Low | Higher (long-lived JSON-RPC process) |

Gemini critic isolation:

| Criterion | A. Deny-all policy via a throwaway `GEMINI_CLI_HOME` | B. `--approval-mode plan` | C. `tools.core` empty allowlist |
|---|---|---|---|
| Model sees no tools | Yes (documented for global deny rules) | No, read tools remain | Probably (`unverified`) |
| Keeps OAuth login | No (home differs), needs API key or Vertex | Yes | Yes |
| Meets decision 7 "no tools" | Yes | No | Unproven |

## Recommendation

1. Add both as later-wave tested adapters that follow the generic descriptor route: subprocess, JSONL parse, config-home override. Do not special-case them in the core (decision 17).
2. Gemini CLI: classify as proposer and tool-less critic (both). The critic profile is `-p --output-format stream-json --model <pinned>` with a deny-all policy file in a run-local `GEMINI_CLI_HOME`, authenticated by `GEMINI_API_KEY`/Vertex env (Tier 2) or by copying nothing secret (so OAuth login critic use is limited to a non-isolated home, which is a Principle VIII trade-off to be ruled by the owner as part of the known Tier 1 tension). Context window declared as min(1,048,576, 150,000 compression threshold) for the pinned model.
3. Copilot CLI: proposer first. Critic role only after a probe of these: (a) `--available-tools` with an empty or dummy list gives a run with no tool calls; (b) per-model context window for the pinned model; (c) the JSONL schema and `-p` exit code on quota exhaustion. Until then the descriptor marks the critic role "unverified" and decision 17's known-window rule excludes it from automatic critic selection.
4. Set `COPILOT_AUTO_UPDATE=false` and pin, because both CLIs update quickly.
5. Do not use `@github/copilot-sdk` in Wave 1 of the adapter; revisit if the JSONL schema stays undocumented, since the SDK's typed events would then be the only stable contract.

Confidence: medium-high for the Gemini classification (policy deny-all and stream-json are documented; model and quota signalling are the soft spots). Medium-low for the Copilot critic classification (documentation gaps F14). High for "not registered today".

## Matrix rows

Columns: harness; tested or unverified; detect/version command; headless invocation; stream format; TS SDK; auth modes; tier; proposer?; tool-less critic?; quota signal; terms status; version pin + verified-on; delivery wave.

| Harness | Tested or unverified | Detect/version | Headless invocation | Stream format | TS SDK | Auth modes | Tier | Proposer? | Tool-less critic? | Quota signal | Terms status | Version pin + verified-on | Delivery wave |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Gemini CLI | unverified (docs and source only; not installed here) | `gemini --version` (`inferred`) | `gemini -p "<prompt>" --output-format stream-json --model <pinned> --approval-mode yolo\|auto_edit\|plan` | `stream-json` JSONL: init, message, tool_use, tool_result, error, result; `json`: `{response, stats, error?}` | `@google/gemini-cli-sdk` exists in repo, unpublished; `@google/gemini-cli-core` published, internal | Sign in with Google (OAuth, personal, Workspace, Code Assist licences); `GEMINI_API_KEY`; Vertex (ADC, service account, `GOOGLE_API_KEY`) | Tier 1 (login), Tier 2 (API key, Vertex) | yes | yes, via deny-all policy TOML (`toolName="*"`); run-local policy injection and sub-agents need a probe; window 1,048,576 (150k CLI compression default) | Typed `TerminalQuotaError`/`RetryableQuotaError` with retry delay in source; surfacing in JSON `error`/exit 1 unverified; `/stats model`; exit 53 = turn limit | see R8 | `>=0.61.0 <0.62.0`, verified-on 2026-09-29 (docs only) | Later wave, one adapter feature (roadmap 13x) |
| GitHub Copilot CLI | unverified (docs only; VS Code shim present here, CLI absent) | `copilot --version` | `copilot -p "<prompt>" --output-format json --model <pinned> --no-ask-user --allow-tool=... --deny-tool=...` (`-s` for plain text) | `--output-format json` JSONL (schema undocumented); SDK exposes typed events | `@github/copilot-sdk` 1.0.15 (MIT; bundles CLI runtime) | `copilot login` (web/device flow), `--with-token`, env `COPILOT_GITHUB_TOKEN`/`GH_TOKEN`/`GITHUB_TOKEN` (fine-grained PAT with "Copilot Requests") | Tier 1 (login), Tier 2 (token env; subscription-bound) | yes | not proven: no documented zero-tool mode; `--available-tools`/`--excluded-tools` emulation needs a probe; default-tier context window unverified | AI-credit billing; `--max-ai-credits` soft cap; exhaustion/rate-limit output under `-p` undocumented | see R8 | `>=1.0.89 <1.1.0`, verified-on 2026-09-29 (docs only) | Later wave, one adapter feature (roadmap 13x) |

## Open questions / risks

1. Probes needed when a machine has the CLIs and an authorised account (each is a small, explicit measurement probe, not run now):
   - Gemini: does a deny-all policy in a run-local `GEMINI_CLI_HOME` produce zero `tool_use` events, including sub-agents; what the JSON `error` object and exit code are on a 429 or exhausted daily quota; can `-p --resume <uuid>` run headlessly; where the OAuth cache lives (to know what a throwaway home loses).
   - Copilot: `--available-tools ""` behaviour; JSONL event schema; exit code and error event on plan exhaustion; per-model window for `claude-sonnet-4.6`; behaviour of `--no-ask-user` with denied tools.
2. Decision 17 evidence, for the DECISIONS-PENDING file at the orchestrator's discretion (not a contradiction, so `continue on the decision as written`): the known-context-window rule excludes Copilot from automatic critic discovery today because the window per model is not documented for the default tier. Default to proceed: Copilot is proposer-only and can be a critic only when declared in config with a window. If the owner rules otherwise (allow undeclared windows), the critic budget would be guessed, which Principle IX forbids.
3. Tier 1 vs Principle VIII: both CLIs keep OAuth login in their default home, so a throwaway home loses the login (F19). This sharpens an already-listed tension; no new decision needed, but the divergence row should name both.
4. Model and documentation churn: Gemini CLI docs name preview models the API reports as shut down (F17); Copilot's model list changes weekly. An adapter must pin a model explicitly and the doctor should verify that the pinned model is still served (`inferred`).
5. Copilot CLI redistribution licence (F13) constrains bundling under decision 19 (MIT distribution of Specstride). Not a problem if Specstride only invokes a user-installed CLI. Hand to R8 and to the packaging research.
6. `--version` flag for Gemini and the `copilot` CLI reading `~/.copilot` state at detect time are `inferred`; the doctor's detect step must avoid `copilot version` (network) and any command that triggers the shim installer prompt seen locally (F2).
7. Terms of service, plan tiers and whether subscription-backed headless use is permitted: not assessed here. See R8.
8. Independence: this report used a summarising fetcher for several pages; the two tables of raw github/docs and gemini-cli files were read in full text, the other claims rest on summaries and are tagged accordingly. A verifier should re-check F4 (quota numbers) and the Copilot supported-token-types list.
