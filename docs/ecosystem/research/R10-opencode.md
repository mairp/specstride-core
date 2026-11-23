# R10 — opencode

Access date for every `verified-doc` tag: 2026-09-29. opencode is not installed here (`command -v opencode` printed nothing, `verified-local`); no install, login or model call was made.

## Prior art consulted

Read in full: `/root/specstride-harness-roadmaps/roadmap/harnesses/opencode.md` (roadmap OC-1..OC-7, researched 2026-09-26 on v1.18.32), `.../research/harnesses/opencode-contract.md` (live smoke tests), `.../opencode-ecosystem.md` (issues, ecosystem; read the top part).

- Reused (as `verified-prior`, i.e. observed live by the earlier researcher on 2026-09-26, not re-observed by me): stdin prompts up to 200 KiB; argv fails with E2BIG; JSONL record types; rc 0/1 with a JSON `error` record; auto-reject of permission asks in `run`; XDG_* + TMPDIR overlay isolation; `--title` avoids a second model call; a deny-all agent resolves every tool to off at config level. I treat these as `inferred` from a trusted local report, not `verified-local`.
- Extended: SDK and server endpoints, event names, the credentials mechanism, the current version (1.18.33, one patch newer), the universal-proposer analysis.
- Contradicted or updated: (a) the prior note says Claude Pro/Max login "via plugin" exists; the current providers page says Anthropic "explicitly prohibits" that use with opencode and lists ChatGPT Plus/Pro, GitHub Copilot and GitLab Duo as supported subscription logins. (b) The prior "critic: direct HTTP" verdict is still right, but the config-level deny-all agent is a stronger fallback than the prior note gave it credit for (see Q6). (c) The prior note is Python/Bash-shaped (`proposer.sh` arms); nothing there transfers except the facts.

## Questions answered

1. Headless mode? `opencode run [message..]`, one prompt, exit at session idle. Flags: `--format default|json`, `-c/--continue`, `-s/--session`, `--fork`, `--agent`, `-m provider/model`, `--dir`, `--attach <url>`, `--auto`, `-f/--file`, `--share`, `--port`. Prompt on stdin works; stdin must be a closed file or `/dev/null` (a non-TTY stdin that never closes blocks).
2. Server mode? `opencode serve` (`--port --hostname --mdns --cors`), basic auth via `OPENCODE_SERVER_PASSWORD` (and `OPENCODE_SERVER_USERNAME`). REST: `POST /session`, `POST /session/:id/message` (body includes `model`, `agent`, `system`, `tools`, `parts`), `POST /session/:id/prompt_async`, `/abort`, `/fork`, `POST /session/:id/permissions/:permissionID`, `GET /event` (SSE, first event `server.connected`), `GET /doc` (OpenAPI 3.1).
3. TS SDK? `@opencode-ai/sdk` 1.18.33 (MIT), `createOpencode()` (starts server and client) and `createOpencodeClient({baseUrl})`; `session.prompt()` with structured output (`format: {type:'json_schema', ...}`, `retryCount`, `StructuredOutputError`); `event.subscribe()` (SSE).
4. Event format? Two surfaces. CLI `--format json`: JSONL `{type, timestamp, sessionID, part|error}` with `step_start`, `tool_use` (only when a tool completes or errors), `step_finish` (reason, tokens, cost), `text` (at part end), `reasoning` (with `--thinking`), `error`. No init record, no model name, no result record; records appear only when a part finishes, so long tools are silent. SSE via server/SDK is richer (part-level updates, `permission.asked`, `session.error`, `session.idle`; exact type names beyond `server.connected` `unverified` here, read from the OpenAPI at `/doc` at adapter-build time).
5. Credentials? `~/.local/share/opencode/auth.json` (under `$XDG_DATA_HOME/opencode`), written by `/connect` / `opencode auth login`; plain JSON file, not a keychain (mechanism per docs and prior source read; file contents never read). Also env vars per provider and `{env:VAR}` / `{file:...}` interpolation in config. Custom OpenAI-compatible providers via `provider` config.
6. Session resume? `-c` continues the last session, `-s <id>` a specific one, `--fork` branches; SDK/server: session id + `POST /session/:id/message`. Sessions live in a SQLite DB in the data home, so resume needs the same `XDG_DATA_HOME` (a per-pass throwaway overlay defeats it).
7. Tool restriction for critic? Config `permission` keys (`read edit bash glob grep task skill lsp question webfetch websearch external_directory doom_loop`) each allow/ask/deny, global or per agent; a custom primary agent with `permission: {"*":"deny"}` resolves every tool to false (prior live check at config level; no LLM call made). Legacy `tools: {x:false}` still supported. `POST /session/:id/message` also accepts `tools`. Env `OPENCODE_PERMISSION` (JSON) exists in source per prior read; the current permissions page does not document it (`verified-doc` negative). MCP tools: docs silent; MCP servers load only from config (prior read), so an empty `mcp` plus `OPENCODE_DISABLE_PROJECT_CONFIG=1` covers it. Limits: no OS sandbox; system prompt (~8k tokens per prior) and AGENTS.md injection still apply.
8. Quota errors? Provider HTTP errors surface as a JSON `error` record (`name: APIError`, `data.statusCode`, `data.isRetryable`, `data.message`, `responseHeaders`) and rc 1. But headless has open bugs where 429/quota leaves `run` hanging (#8203 "hangs forever on API errors"; #40747 per prior) and the runner retries internally, so a quota exhaustion may show as a stall, not a clean exit. Free/gateway variants use `FreeUsageLimitError` in message text (#42029). Classification must key on `statusCode` 429 plus message patterns; no structured "resets at" field is documented (headers may carry Retry-After).
9. Version pin: `opencode-ai@1.18.33` (npm latest, published 2026-09-28, MIT). Prior tested 1.18.32. Verified-on 2026-09-29 for existence/docs only, not run.

## Findings

- F1 `verified-doc` opencode.ai/docs/cli: run flags above; `serve`; `auth login/list`; `--version`.
- F2 `verified-doc` opencode.ai/docs/server, /sdk: endpoints, SSE, SDK names, structured output.
- F3 `verified-doc` opencode.ai/docs/providers: auth.json path; models.dev, 75+ providers; OpenAI-compatible custom providers; Anthropic subscription use "explicitly prohibited"; ChatGPT/Copilot/GitLab logins supported.
- F4 `verified-doc` opencode.ai/docs/permissions, /agents: permission keys, per-agent override, tools merged into permission, `steps` cap, per-agent `model`, built-in read-only Explore/Scout agents.
- F5 `verified-doc` opencode.ai/docs/config: `OPENCODE_CONFIG_CONTENT` (highest precedence inline config), `OPENCODE_CONFIG_DIR`, provider `timeout/headerTimeout/chunkTimeout`, `share`, `autoupdate`, `snapshot`, `small_model`.
- F6 `verified-doc` npm registry query 2026-09-29: `opencode-ai` and `@opencode-ai/sdk` latest 1.18.33, MIT.
- F7 `verified-doc` github.com/anomalyco/opencode/releases: v1.18.33 on 2026-09-28; more than 88 pages of releases; v1 and v2 lines coexist.
- F8 `inferred` (prior live report) run-mode behaviour: new session per run, auto-reject of asks, overlay isolation, `--title` cost trap, tool-name lowercase (`write edit bash read apply_patch`) with `filePath` key.
- F9 `verified-doc` (search results, issue titles only) #8203, #42029, #49039: 429 handling in headless is weak (hang or hard failure without honoring backoff).
- F10 `inferred` Cost: `step_finish.cost` is 0 for custom providers without configured cost; subagent cost omitted (#45417 per prior).
- F11 `unverified` Whether v2 is default anywhere yet and whether v2 `run --format json` keeps the v1 schema. Prior says v2 removes `--command`/`--port` and has open regressions; I could not read v2 docs from the release page.

## Version/date pins

Range to record: `opencode-ai >=1.18.32 <1.19` (tested by prior researcher live on 1.18.32; 1.18.33 doc/registry-verified only). Verified-on 2026-09-29 (registry, docs) and 2026-09-26 (live, prior). Doctor should warn on major 2.x until an adapter is tested against it (decision 10).

## Options compared

Universal proposer question: should opencode be the one adapter fronting many providers?

| Criterion | A. opencode as universal proposer | B. Native adapter per harness plus generic descriptor (decision 17) | C. Hybrid: B primary, opencode as one tested adapter and as descriptor-driven fallback for provider-only endpoints |
|---|---|---|---|
| Adapters to write | Fewest for API-key providers (75+ via models.dev) | One per harness | One per harness plus one opencode adapter |
| Tier 1 (user's logged-in CLI, decision 6) | Poor: it replaces each vendor CLI; Claude subscription is prohibited, so it does not front Claude/Codex/Gemini subscriptions | Native | Native for the vendor CLIs |
| Terms exposure (R8 owns) | High: subscription logins through a third-party client (Anthropic prohibits; account-ban report #6930) | Each vendor's own CLI is the sanctioned path | Contained: opencode used with API keys only by default |
| Stream fidelity | Coarse: no init/result record, part-completion only, model absent, cost 0 for custom providers | Native streams are richer (Claude stream-json) | Same per adapter |
| Reliability | Open headless hangs, 429 hang, 130+ releases in 6 months, v2 rewrite | Vendor CLIs vary but are the supported path | opencode risk isolated to opt-in |
| Evolvability | Single dependency on one project's churn; core would encode opencode's model | Adapter seam stays generic; new harness = descriptor or adapter | Seam generic; opencode is just one adapter |
| Discovery-friendly | Only finds what opencode can reach | Any harness | Any harness |
| Wave 1 fit (decision 13) | Not needed | Claude adapter only | Same |

Critic tool restriction: (i) direct HTTP to the provider (no tools at all, no 8k system prompt) versus (ii) `opencode run --agent critic` with `permission "*": deny` (tools off, but provider client, AGENTS.md and title call remain). (i) is cleaner; (ii) is acceptable where the only credential is an opencode-managed login.

## Recommendation

1. Do not make opencode the universal proposer, and do not count it as reducing the adapter count. It reduces work only for API-key providers, and Specstride's generic descriptor (decision 17, R20) covers those cheaper by making any OpenAI-compatible endpoint a descriptor entry without opencode's runtime. Keep opencode as a tested adapter in a later wave (decision 13), API-key providers by default, with one descriptor-driven form (`opencode run --format json -m provider/model --title ... --dir ... < prompt`) and a `DECISIONS-PENDING`-free default. Confidence: medium-high.
2. Its tools can be restricted enough for critic use in principle (deny-all agent, per-agent `permission`, `tools` on the message API), but as the default critic path prefer direct provider HTTP; use the deny-all agent only as a fallback. The critic must always be a fresh session (decision 22), which `run` gives by default. Confidence: medium (deny-all was verified at config level only; never exercised with a live call).
3. If adopted later, drive `opencode serve` plus SDK (`session.prompt`, `event.subscribe`) instead of one-shot `run`, once measurement (OC-7 style, 50 passes each) shows a lower hang rate; the SSE stream also gives permission and idle events that `run` hides. The pinned range must exclude 2.x.
4. Quota (R14 owns design): treat `APIError.statusCode==429` and a stall after an error as the pause trigger; a watchdog must cover the 429 hang case because the process may never emit a terminal record.

## Matrix rows

| harness | tested or unverified | detect/version | headless | stream | TS SDK | auth modes | tier | proposer? | tool-less critic? | quota signal | terms | version pin + verified-on | wave |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| opencode | tested by prior live smoke (1.18.32, 2026-09-26); not installed here, so unverified locally | `command -v opencode`; `opencode --version` (npm `opencode-ai`) | `opencode run --format json -m p/m --title T --dir D < prompt`; or `serve` + `--attach` | JSONL step_start/tool_use/step_finish/text/error; no init/result; completion-only; SSE via server | `@opencode-ai/sdk` 1.18.33 | provider env keys, `auth.json` (`$XDG_DATA_HOME/opencode`), custom OpenAI-compatible; ChatGPT/Copilot/GitLab logins; Claude login prohibited by Anthropic | 2 (API key); 1 only if user's own opencode login; 3 refused | yes, API-key providers | yes via deny-all agent (config-verified) or direct HTTP preferred | `error` record APIError statusCode 429; hang risk (#8203) | deferred to R8 (subscription use of Anthropic prohibited per opencode docs) | `>=1.18.32 <1.19`, 2026-09-29 (docs), 2026-09-26 (live) | later wave, after Claude |

## Open questions / risks

- Not verified: SSE event type list; v2 `run` schema; SIGTERM codes; max-steps rc (prior says 0); real 429 behaviour on a current version; auth.json copy into an overlay; SQLite locking with a shared overlay.
- Release churn and the v2 rewrite are the dominant risk to evolvability.
- Terms: subscription logins through a third-party client are R8's decision; this report only records that opencode's own docs prohibit the Claude case.
- Provider discovery prior art for R20: opencode reads env vars per provider, `auth.json`, config `provider` entries, and the models.dev catalog (`opencode models <provider> --verbose` gives context limits); it does this without a hard-coded closed list, which matches decision 17's spirit.
- No `DECISIONS-PENDING` item: nothing found contradicts decisions 6, 7, 10, 13 or 17.
