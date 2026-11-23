# R5 — Claude as proposer and critic

Access date for every URL below: 2026-09-29. Doc pages were fetched as raw Markdown
(`https://code.claude.com/docs/en/<page>.md`) into `/tmp/specstride-research/R5/docs/` and grepped, so
quoted strings are verbatim. SDK types were read from the published package tarball
(`npm pack @anthropic-ai/claude-agent-sdk@0.3.284`, unpacked in `/tmp/specstride-research/R5/sdk/`; nothing installed).
No paid model call, no login and no state change was made.

## Prior art consulted

| Source | Used for | Reused / extended / contradicted |
|---|---|---|
| `prompts/analysis/A4-claude-code-host-facts.md` (§ "Headless `claude -p` as proposer or critic") | Starting list of flags | **Reused and verified**. **Extended** with `--safe-mode`, `--restricted`, `--permission-prompts`, `--fork-session`, `--system-prompt-snapshot`, `rate_limit_event`, root refusal of bypass mode. A4 says streaming "needs `--verbose`": confirmed by docs. |
| `/root/specstride` at `9cab15d`: `proposer.sh:570-581`, `proposer.sh:1621-1639`, `lib/critic.py:157-165`, `:186-196`, `:1875-1899`, `:2353-2395`, `lib/agent_stream.py:88-210`, `lib/backends.py:52-61`, `lib/backend_overlay.py:1-37`, `.env.example:60-65` and `:104-115` | Today's Claude proposer arm, critic path, stream adapter, overlay plumbing | **Reused** as the parity reference. **Contradicted** in one place: Principle VIII's evidence cites `--disable-slash-commands` at `proposer.sh:1437`; at `9cab15d` it is at `proposer.sh:1634-1635`. |
| `.specify/memory/constitution.md` v2.0.3, Principles VIII (lines 234-258), IX (260-279), XI (294-315), XII (317-340) | Normative constraints | Built on; tensions reported below. |
| `/root/specstride-otel-prompts` (`936afea`, one commit past `9cab15d`), `git diff 9cab15d HEAD` | Prompt capture and trace nesting | **Reused**: `TRACEPARENT` injection and `--settings` for `OTEL_RESOURCE_ATTRIBUTES`. |
| qmd fleet memory (a fleet note on the model gateway (`infra/` collection), query hits on the gateway notes) | What the host model gateway serves | Reused as fleet fact. One later qmd query timed out after 200 s, so the model inventory is from one note only. |
| Installed `claude` 2.1.284 `--help` | Flag existence on this machine | Primary local evidence. |

## Questions answered

### Q1. Agent SDK versus `claude -p --output-format stream-json`

They are the same engine. The docs describe `claude -p` as "using the Agent SDK via the CLI", and the SDK as
"a library that runs the Claude Code binary". The TypeScript SDK ships the binary as per-platform optional
dependencies and spawns it; `pathToClaudeCodeExecutable` defaults to "auto-resolved from bundled binary".
The message stream is the same protocol in both.

| Criterion | `claude -p` subprocess | `@anthropic-ai/claude-agent-sdk` `query()` |
|---|---|---|
| What runs | The user's installed `claude` | A binary bundled with the SDK version (or the installed one via `pathToClaudeCodeExecutable`) |
| Version under test | The installed CLI; the doctor reads `claude --version` | SDK 0.3.284 tracks CLI 2.1.284; two versions to pin unless the path is overridden |
| Auth | Everything in the precedence list, including the `/login` subscription | Same binary, so technically the same. **Policy**: the SDK overview states third-party developers may not offer claude web login or rate limits in their products without prior approval, and says to use API key methods |
| Stream | NDJSON on stdout; needs `--verbose` | Typed `SDKMessage` async iterator |
| Extras | None beyond flags | `canUseTool` callback, in-process hooks, in-process MCP servers, `interrupt()`, `listSessions()`, `getSessionMessages()`, `sessionStore` |
| Dependencies | None (a subprocess) | Peer deps `zod ^4`, `@anthropic-ai/sdk >=0.93.0`, `@modelcontextprotocol/sdk ^1.29.0`; about eight platform binary packages; licence "SEE LICENSE IN README.md" (Anthropic Commercial Terms, not MIT) |
| Fit with the generic adapter (decision 17) | Same shape as every other harness: argv, stdin, NDJSON | Claude-only shape |

Meaning for the tiers (decision 6):

- **Tier 1** is the CLI subprocess. It uses the consumer's own installed and logged-in CLI, which is what
  decision 6 defines. It is also the only option that does not make Specstride a product "offering claude's web app
  login" through the SDK. R8 owns the ruling; this report supplies the fact.
- **Tier 2** has two legitimate forms. The proposer needs an agent loop with tools, so it is either the same CLI
  subprocess with `ANTHROPIC_API_KEY` (optionally `--bare`), or the Agent SDK with an API key. The critic needs
  no agent loop at all, so its Tier 2 form is a direct Messages API call, which is what `call_claude` does today
  (`lib/critic.py:1875-1899`) and what Principle IX calls "direct HTTP first".

### Q2. The tool-less, budget-capped, different-tier, isolated critic

**Tier 1 (subscription login, CLI subprocess).** Prompt on stdin, in an empty temporary working directory:

```
cd "$(mktemp -d)" && claude -p \
  --model <critic-model>                 # a different tier from the proposer's
  --tools "" \                           # no built-in tools
  --disallowedTools "mcp__*" \           # no MCP tools
  --strict-mcp-config \                  # no MCP servers from any config (none passed)
  --safe-mode \                          # no CLAUDE.md, skills, plugins, hooks, MCP, agents, auto memory; auth unchanged
  --disable-slash-commands \
  --session-id <uuid minted by the adapter> \
  --no-session-persistence \             # nothing written, nothing resumable
  --max-budget-usd <n> \
  --max-turns 1 \
  --permission-mode dontAsk --permission-prompts none \
  --system-prompt-file <critic-system-prompt> \
  --output-format stream-json --verbose
```

`--bare` cannot be used here because it never reads OAuth credentials. `--safe-mode` is the Tier 1 substitute:
it disables customisations while "authentication, model selection, built-in tools, and permissions work
normally". `--restricted` is a second candidate (it ignores user, project and local settings and removes
command-running tools), but whether it combines with `--safe-mode` was not tested.

**Tier 2 (API key), preferred: no harness at all.** `POST /v1/messages` with `model`, `max_tokens` and one user
message, no `tools` field. There is no session, no tool and no config home by construction. Budget is
`max_tokens` plus the prompt-size budget the critic already enforces.

**Tier 2 alternative through the SDK:**

```ts
query({ prompt, options: {
  model, tools: [], disallowedTools: ["mcp__*"], mcpServers: {}, strictMcpConfig: true,
  settingSources: [], persistSession: false, sessionId: crypto.randomUUID(),
  maxBudgetUsd, maxTurns: 1, permissionMode: "dontAsk",
  systemPrompt: criticSystemPrompt, cwd: emptyTmpDir,
  env: { ...minimalEnv, CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" } } })
```

Note `env` replaces the subprocess environment; it does not merge.

**How the critic is guaranteed never to share or approve the proposer's session** (five independent layers):

1. The adapter's critic code path has no parameter for `--resume`, `--continue` or `--fork-session`; the critic
   invocation type cannot express them.
2. The adapter mints the critic's session UUID and keeps a per-run set of proposer session ids. After the
   `system/init` event it asserts the reported `session_id` equals the minted one and is not in the proposer set.
   A mismatch is scored as a failed critic call, never as a verdict.
3. `--no-session-persistence` means the critic session is never on disk, so no later proposer pass can resume it.
4. The critic runs in an empty temporary directory, so project `.claude/` settings, `.mcp.json` and CLAUDE.md
   are not in reach even if a flag regresses.
5. The per-call nonce (Principle II) stays the final check: a verdict counts only if the reply carries the nonce
   generated for that call.

The adapter also asserts from `system/init` that `tools` is empty and `mcp_servers` is empty, and refuses the
reply otherwise. This turns "the critic has no tools" from a flag we hope works into a fact observed per call.

### Q3. What `--bare` implies

- **Auth**: "Anthropic auth is strictly `ANTHROPIC_API_KEY` or `apiKeyHelper` via `--settings` (OAuth and keychain
  are never read)". It does not read `CLAUDE_CODE_OAUTH_TOKEN` either, and does not read Anthropic profiles.
  Bedrock, Vertex and Foundry keep using their own credentials. So `--bare` is **Tier 2 only**.
- **Loading**: skips hooks, skills, custom commands, subagents, installed plugins, MCP servers, LSP, auto memory,
  CLAUDE.md discovery, plugin sync, attribution and background prefetches. Sets `CLAUDE_CODE_SIMPLE=1`.
  Context comes back only through explicit flags (`--settings`, `--mcp-config`, `--agents`, `--plugin-dir`,
  `--append-system-prompt[-file]`, `--add-dir`).
- **Side effect**: system-prompt recording is off in bare mode unless `--system-prompt-snapshot on` is passed.
- **Future**: the docs say `--bare` "will become the default for `-p` in a future release". When that happens a
  Tier 1 invocation that relies on the default will lose its subscription auth. The adapter must therefore state
  its mode explicitly on every call and the version pin must watch for this change.

### Q4. Session continuation inside one attempt, and forcing a fresh session

| Need | CLI | SDK |
|---|---|---|
| First pass of an attempt | `--session-id <new uuid>` (no `--resume`) | `sessionId` |
| Later pass in the same attempt | `--resume <session-id>` | `resume` |
| New attempt | `--session-id <new uuid>`, no `--resume` | new `sessionId` |
| Never | `--continue` | `continue: true` |

`--continue` must not be used. It picks "the most recent conversation in the current directory", and with `-p`
that includes `-p`, SDK and `/loop` sessions, so it could pick up the consumer's own session or the host skill's
session in the same project directory.

Facts that shape the design:

- The session id is on `system/init` and on every `result` message, success or error.
- On resume, `total_cost_usd` reports the conversation's whole total, earlier runs included, while
  `--max-budget-usd` counts only the current call's spend. Telemetry must record per-pass deltas.
- The system prompt is recorded on the first request and reused on resume; different `--system-prompt` or
  `--append-system-prompt` text on a later pass takes effect only after compaction. Per-pass instructions must
  therefore go in the user prompt, not the system prompt.
- SIGTERM exits 143 and leaves the turn unfinished; on resume the next prompt drives the conversation.
  `CLAUDE_CODE_RESUME_INTERRUPTED_TURN=1` makes the interrupted turn continue instead. This is a direct lever
  on aim 2 (work lost when a pass is killed at the time cap): the watchdog should send SIGINT first.
- Continuation requires session persistence, so the proposer cannot use `--no-session-persistence` when
  decision 22 is on. Transcripts land in `<config dir>/projects/<encoded-cwd>/<session-id>.jsonl`.
- Under the parity oracle continuation is off: every pass gets a new `--session-id` and
  `--no-session-persistence`.

### Q5. Capturing the stream and transcripts (Principle XI)

Three sources, in order of authority:

1. **The stdout stream** (`--output-format stream-json --verbose`). The adapter tees the raw NDJSON to the
   invocation directory before parsing, as today. Mapping to the existing vocabulary is unchanged from
   `lib/agent_stream.py:99-210`: `system/init` to `agent_init`, `assistant` text and `tool_use` blocks to
   `agent_text` / `agent_tool` / `evidence_writing`, `result` to `agent_result`, and a stream that ends without
   `result` to `missing_terminal`. New records the old adapter ignores and the new one should map:
   `system/api_retry`, `rate_limit_event`, `permission_denied`, and `result.permission_denials`.
2. **The session transcript** `.jsonl`, present only when persistence is on. Useful as a recovery source for a
   killed pass, since the stream may be truncated. It is secondary: the stream is the record.
3. **Claude Code's own OpenTelemetry**, optional. In `-p` and SDK sessions Claude Code reads `TRACEPARENT` and
   `TRACESTATE` from its environment and parents its spans under the caller's trace, which is what
   `/root/specstride-otel-prompts` relies on. That work also found that `settings.json` `env` beats the process
   environment for `OTEL_RESOURCE_ATTRIBUTES` and that a `--settings` flag beats both, so it injects the resource
   attributes through `--settings`. Content is redacted unless `OTEL_LOG_USER_PROMPTS`,
   `OTEL_LOG_ASSISTANT_RESPONSES`, `OTEL_LOG_TOOL_DETAILS` or `OTEL_LOG_TOOL_CONTENT` is set.

Truthfulness rules that follow from the docs: `total_cost_usd` is a client-side estimate, so the event field must
be labelled an estimate; `usage` on the result covers the main loop only and `modelUsage` is the complete figure;
the model recorded is the one reported by the stream, else the one passed on argv, else `null`. For a killed pass
there is no `result`, so cost is `null`, not zero. R14 owns the schema.

### Q6. The host model gateway as a second model for the critic

Today's Claude critic path is direct HTTP to an Anthropic-compatible endpoint: `critic_call` dispatches to
`call_claude` (`lib/critic.py:2357-2359`), which reads a critic-specific key and base URL before the general ones
(`lib/critic.py:1878-1891`) precisely so that "an Anthropic-compatible critic gateway" stays isolated from the
proposer's CLI environment. The default critic model is an Opus-tier id (`lib/critic.py:2358`) and the context
table is at `lib/critic.py:157-165`. A second path, belonging to a locally registered backend, reaches the
gateway's OpenAI-compatible `/v1/chat/completions` endpoint through `call_openai_chat`
(`lib/critic.py:2375-2393`), with the model supplied by environment and no hardcoded default.

Fleet facts: the gateway is a LiteLLM proxy on localhost serving OpenAI-family reasoning models and local
open-weight models in OpenAI format, with a declared context window for the OpenAI-family entries.

**Answer: yes on the owner's host, no as a general default.** On this host the gateway can supply a non-Claude
critic in Wave 1, which satisfies decision 7's preference and would silence the same-model warning. It needs
only an OpenAI-compatible HTTP critic client, which the generic adapter needs anyway. It is not a Claude adapter
feature and it cannot be assumed for consumers (decision 19), so it enters through config or discovery (R20),
in second place in decision 17's critic order. Two conditions apply: the model must have a known context window
(Principle IX), and it is a Tier 2 path whose cost accounting R14 must cover.

### Q7. Proposer isolation: throwaway config home versus the logged-in config

On Linux the login lives in `<config dir>/.credentials.json`; on macOS the Keychain entry is keyed to the config
directory. A fresh `CLAUDE_CONFIG_DIR` therefore has **no login**. That is the whole tension.

| Option | Isolation achieved | Tier 1 auth | Cost |
|---|---|---|---|
| A. Real config dir, `--safe-mode`, `--strict-mcp-config`, `--disable-slash-commands`, explicit `--permission-mode` | No hooks, plugins, skills, MCP, CLAUDE.md, auto memory. Transcripts and `~/.claude.json` still written to the real home | Works | Not a throwaway home: the run leaves transcripts behind and reads managed settings. Project CLAUDE.md is also dropped, which may be unwanted for a proposer |
| B. Real config dir, `--setting-sources` narrowed, `--settings <file>` | Finer control than A; project settings can stay | Works | More to get wrong; managed settings, `~/.claude.json`, auto memory and claude's web app connectors load regardless of setting sources |
| C. Throwaway `CLAUDE_CONFIG_DIR` plus `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` | Full throwaway home | Works, still subscription | The consumer must mint a one-year token once and store it as an `env:`/`file:`/keychain reference. Whether this counts as Tier 1 or Tier 3 is R8's call. Token can only make model requests |
| D. Throwaway `CLAUDE_CONFIG_DIR` plus API key (optionally `--bare`) | Full throwaway home | None; this is Tier 2 | Real money |
| E. Throwaway dir seeded by copying or linking the credentials file | Full | Works | **Rejected**: Specstride would handle the credential file, and refresh-token rotation in a copy can invalidate the original login |

`CLAUDE_CONFIG_DIR` cannot be set from project or local settings, and `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`
strips credentials and the config-dir pointer from the environment of Bash-tool children, which is a cheap
hardening for the proposer in any option.

**Permission modes for the proposer.** Today's arm passes `--dangerously-skip-permissions --verbose`
(`proposer.sh:1625`). The docs state Claude Code refuses this mode when running as root or under `sudo`, unless
it is inside a recognised sandbox, and recommend it only for isolated containers. The alternatives are
`--permission-mode acceptEdits` with an explicit `--allowedTools` list and `--permission-prompts none` (anything
unlisted is denied and the run continues), or `--permission-mode auto`. Both satisfy "never wait for a human".

### Q8. How usage-limit and rate-limit conditions surface (facts only)

| Signal | Where | Content |
|---|---|---|
| `rate_limit_event` | Stream message | `rate_limit_info.status`: `allowed`, `allowed_warning`, `rejected`; `resetsAt` (number); `rateLimitType`: `five_hour`, `seven_day`, `seven_day_opus`, `seven_day_sonnet`, `seven_day_overage_included`, `overage`; `utilization`; overage fields; `errorCode: "credits_required"`. Documented as "for claude's web app subscription users", emitted "when rate limit info changes" |
| `system/api_retry` | Stream message | `attempt`, `max_retries`, `retry_delay_ms`, `error_status`, `error` category, one of which is `rate_limit`; others include `overloaded`, `billing_error`, `authentication_failed`, `server_error` |
| `assistant.error` | Stream message | Same category enum |
| `result` | Final stream message | `is_error: true`, `subtype: error_during_execution`, optional `api_error_status`, and the human message in `result` / `errors` |
| Message text | In `result` | `You've hit your session limit · resets 3:45pm`, `... weekly limit · resets Mon 12:00am`, `... Opus limit`, `... Sonnet limit`; `API Error: Request rejected (429) ...`; `API Error: Server is temporarily limiting requests (not your usage limit)`; `Credit balance is too low`; spend-limit variants |
| Budget cap | `result` | `subtype: error_max_budget_usd`; turn cap is `error_max_turns` |
| Exit code | Process | Non-zero on failure; 143 on SIGTERM |

Two distinctions matter for R14: a 529 overload "is not your usage limit and doesn't count against your quota",
and `allowed_warning` with `utilization` is an early signal that arrives before rejection, which is what
decision 8's observation-based alert needs. The `rateLimitType` enum is in the SDK type file but not in the docs
page, so it is less stable than the documented fields.

## Findings

| # | Claim | Tag | Evidence |
|---|---|---|---|
| F1 | Installed CLI is 2.1.284 at `/usr/bin/claude`, a native ELF binary | verified-local | `claude --version` gave `2.1.284 (Claude Code)`; `file -L /usr/bin/claude` |
| F2 | The SDK runs the Claude Code binary; `claude -p` is the SDK via the CLI | verified-doc | https://code.claude.com/docs/en/agent-sdk/overview , https://code.claude.com/docs/en/headless |
| F3 | SDK latest is 0.3.284, modified 2026-09-28, with eight platform binary optional deps and three peer deps | verified-local | `npm view @anthropic-ai/claude-agent-sdk version optionalDependencies peerDependencies license time.modified` |
| F4 | Third-party developers may not offer claude web login or rate limits for products, including SDK agents, without approval | verified-doc | https://code.claude.com/docs/en/agent-sdk/overview (Note under "Get started") |
| F5 | `--tools ""` disables all built-in tools; it does not affect MCP tools; `--disallowedTools "mcp__*"` removes them | verified-doc | https://code.claude.com/docs/en/cli-reference ; `--tools` also in local `--help` |
| F6 | `--allowedTools` auto-approves and does not restrict | verified-doc | cli-reference: "To restrict which tools are available, use `--tools` instead" |
| F7 | `--max-budget-usd`, `--no-session-persistence`, `--session-id`, `--fork-session`, `--setting-sources`, `--strict-mcp-config`, `--safe-mode`, `--restricted`, `--permission-prompts`, `--system-prompt-snapshot`, `--fallback-model` exist in 2.1.284 | verified-local | `claude --help` output |
| F8 | `--max-turns` and `--system-prompt-file` are documented but absent from local `--help` | verified-doc | cli-reference, which also says `--help` "does not list every flag" |
| F9 | `--bare` never reads OAuth, keychain, `CLAUDE_CODE_OAUTH_TOKEN` or profiles | verified-doc | headless; https://code.claude.com/docs/en/authentication ; matches local `--help` text |
| F10 | `--bare` will become the default for `-p` | verified-doc | headless, Note in "Start faster with bare mode" |
| F11 | `--safe-mode` disables customisations and leaves auth working | verified-doc | cli-reference; local `--help` |
| F12 | Without `--bare`, a `-p` run executes project hooks and connects project MCP servers with no trust dialog | verified-doc | headless |
| F13 | `--continue` with `-p` includes `-p` and SDK sessions in the current directory | verified-doc | cli-reference, `--continue` row |
| F14 | `--resume <id>` searches every project on the machine since v2.1.223 | verified-doc | headless, "Continue conversations" |
| F15 | Resumed runs report whole-conversation cost; the budget cap counts only the call's own spend | verified-doc | cli-reference `--max-budget-usd` row; https://code.claude.com/docs/en/agent-sdk/cost-tracking |
| F16 | System prompt is recorded on first request and reused on resume | verified-doc | cli-reference, "System prompt flags in resumed conversations" |
| F17 | SIGTERM gives exit 143 and an unfinished turn | verified-doc | headless, "Stop a run with SIGTERM" |
| F18 | Credentials and transcripts live under `CLAUDE_CONFIG_DIR`; macOS Keychain entry is keyed to it | verified-doc | authentication, "Credential management"; https://code.claude.com/docs/en/sessions ; https://code.claude.com/docs/en/env-vars |
| F19 | Managed settings, `~/.claude.json`, auto memory and claude's web app connectors load regardless of setting sources | verified-doc | https://code.claude.com/docs/en/agent-sdk/claude-code-features |
| F20 | Bypass mode is refused as root or under sudo outside a recognised sandbox | verified-doc | https://code.claude.com/docs/en/permission-modes ; the message string occurs in the installed binary (`grep -a -c` gave 3) |
| F21 | This effort's shell runs as uid 0 | verified-local | `id -u` gave `0` |
| F22 | Whether today's Claude proposer arm actually starts as root on this host | unverified | Would need a paid call; not run. The default proposer today is not Claude, so the arm may never have been exercised here |
| F23 | `rate_limit_event` shape and enum values | verified-local | `/tmp/specstride-research/R5/sdk/package/sdk.d.ts:5570-5605` |
| F24 | `rate_limit_event` is documented, with a smaller field list | verified-doc | https://code.claude.com/docs/en/agent-sdk/typescript , `SDKRateLimitEvent` |
| F25 | The CLI stream carries `rate_limit_event` too | inferred | F2, plus the string occurs 16 times in the installed binary; not observed in a live stream |
| F26 | `system/api_retry` fields and error categories | verified-doc | headless, "Handle API retries"; matches `sdk.d.ts:3575-3592` |
| F27 | Usage-limit message strings | verified-doc | https://code.claude.com/docs/en/errors , "Usage limits" |
| F28 | `-p` and SDK sessions honour inbound `TRACEPARENT` | verified-doc | https://code.claude.com/docs/en/monitoring-usage |
| F29 | `total_cost_usd` is a client-side estimate | verified-doc | cost-tracking |
| F30 | `--max-budget-usd` is enforced under a subscription login | inferred | The cap is computed from the same client-side estimate, which does not depend on auth mode; not tested |
| F31 | `--safe-mode`, `--restricted`, `--tools ""` and `--strict-mcp-config` combine without conflict | unverified | Only `--help` was run; combination needs one probe call |
| F32 | An empty `--setting-sources` value is accepted by the CLI | unverified | `claude --setting-sources` with no value errors "argument missing"; an empty string was not tried. The SDK documents `settingSources: []` |
| F33 | Today's Claude critic is direct HTTP with critic-specific key and base URL overrides | verified-local | `lib/critic.py:1875-1899` at `9cab15d` |
| F34 | Today's Claude proposer is `claude -p` with prompt on stdin and bypass mode, skills off by default | verified-local | `proposer.sh:570-581`, `:1621-1639` at `9cab15d` |
| F35 | No backend declares a config-home overlay at `9cab15d`, so the Claude proposer runs on the operator's real config | verified-local | `lib/backend_overlay.py:12-15`; `lib/backends.py:52-61` has no `overlay` argument |
| F36 | The gateway serves non-Claude models in OpenAI format with declared context windows | verified-local | qmd document a fleet note on the model gateway (`infra/` collection) |
| F37 | V2 session API was removed in SDK 0.3.142 | verified-doc | https://code.claude.com/docs/en/agent-sdk/sessions |

## Version/date pins

| Item | Pin | Verified on |
|---|---|---|
| Claude Code CLI | 2.1.284 tested; floor 2.1.259 (`--permission-prompts`), and 2.1.248 if `--restricted` is used | 2026-09-29 |
| `@anthropic-ai/claude-agent-sdk` | 0.3.284 (types read, not executed) | 2026-09-29 |
| Node engine for the SDK | `>=18.0.0` | 2026-09-29 |
| Documentation | code.claude.com/docs, pages listed under Findings | 2026-09-29 |
| Specstride reference | `9cab15d`; OTel work `936afea` | 2026-09-29 |

Capability detection should prefer the `capabilities` array on `system/init` (v2.1.205 and later) over version
comparison, as the docs advise.

## Options compared

| Criterion | A. CLI subprocess for both roles | B. Agent SDK for both roles | C. CLI proposer; critic by tier (CLI at Tier 1, direct HTTP at Tier 2) |
|---|---|---|---|
| Tier 1 default (decision 6) | Yes | Conflicts with F4 for a distributed product | Yes |
| Same adapter shape as other harnesses (decision 17) | Yes | No | Yes |
| Tool-less critic certainty | Flags, checked from `init` | Options, checked from `init` | Flags at Tier 1; by construction at Tier 2 |
| Principle IX "direct HTTP first" | Divergence at both tiers | Divergence | Divergence at Tier 1 only |
| MIT distribution (decision 19) | No Anthropic code shipped | Ships a commercially licensed dependency and binaries | No Anthropic code shipped |
| Version pin (decision 10) | One | Two | One |
| Typed messages, callbacks | No; we own a small parser | Yes | No |
| Evolvability | High | Lower: Claude-specific seam | High |

## Recommendation

**Option C. Confidence: high for the structure, medium for the exact Tier 1 critic flag set until one probe
call confirms F31.**

1. One Claude adapter built on the `claude` subprocess with `--output-format stream-json --verbose`, prompt on
   stdin. No Agent SDK dependency in Wave 1. Borrow message type definitions only as a reference for the parser.
2. Proposer: `--session-id` per attempt, `--resume <id>` for later passes in the attempt, never `--continue`.
   Default isolation is option A in Q7 (`--safe-mode`, `--strict-mcp-config`, `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`)
   with option C (throwaway config dir plus long-lived token) and option D (API key) as configured upgrades.
   Permission mode `acceptEdits` plus an allow list and `--permission-prompts none`; bypass mode only when the
   doctor detects a sandbox and a non-root user.
3. Critic: Tier 1 uses the command in Q2; Tier 2 uses a direct Messages API call. Both are fresh every time and
   both are checked against the five layers in Q2.
4. The adapter states its mode on every call (never relying on `-p` defaults) because of F10.
5. The gateway critic is a config or discovery entry handled by the generic OpenAI-compatible critic client, not
   by the Claude adapter.

Cost of this choice: we maintain an NDJSON parser and lose the SDK's typed callbacks. The seam should keep a
transport interface so an SDK transport can be added later for Tier 2 without touching the core.

## Matrix rows

| harness | tested or unverified | detect/version command | headless invocation | stream format | TS SDK | auth modes | tier | proposer? | tool-less critic? | quota signal | terms status | version pin + verified-on | delivery wave |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Claude (Claude Code CLI) | tested adapter; flags verified by `--help` and docs, no live call in this research | `command -v claude`; `claude --version`; `claude auth status` | `claude -p --output-format stream-json --verbose`, prompt on stdin | NDJSON: `system/init`, `assistant`, `user`, `system/api_retry`, `rate_limit_event`, `result` | `@anthropic-ai/claude-agent-sdk` 0.3.284 (spawns the same binary); not used in Wave 1 | `/login` subscription OAuth; `CLAUDE_CODE_OAUTH_TOKEN`; `ANTHROPIC_API_KEY`; `ANTHROPIC_AUTH_TOKEN`; `apiKeyHelper`; Bedrock, Vertex, Foundry | 1 (CLI with login, default); 2 (API key, `--bare` allowed; critic by direct HTTP) | yes | yes: `--tools "" --disallowedTools "mcp__*" --strict-mcp-config`, verified from `init` | `rate_limit_event` (status, `resetsAt`, `utilization`); `api_retry.error = rate_limit`; `result.is_error` with limit text | defer to R8; SDK docs restrict offering claude web login in third-party products | CLI 2.1.259 to 2.1.284, verified 2026-09-29 | Wave 1 |

## Open questions / risks

1. **DECISIONS-PENDING: bypass mode is refused as root (F20, F21, F22).** Today's arm passes
   `--dangerously-skip-permissions`, and the docs restrict that mode to sandboxes and non-root users. Default to
   proceed on: `acceptEdits` plus an allow list and `--permission-prompts none`. If the owner rules that bypass
   mode stays, the run must be in a recognised sandbox as a non-root user, and that becomes a doctor check and an
   installation requirement. This also changes parity: the argv the oracle sees differs, so it needs a divergence
   register row either way.
2. **DECISIONS-PENDING: Principle VIII throwaway home cannot hold at Tier 1 without a token (Q7).** Default to
   proceed on: option A (real config dir, customisations off) and reword Principle VIII to "the operator's config
   is never mutated and no customisation is loaded", with a full throwaway home available through option C or D.
   If the owner requires a true throwaway home by default, Tier 1 needs a one-time `claude setup-token`, subject
   to R8.
3. **`--bare` becoming the `-p` default (F10)** would silently break Tier 1. Mitigation is in recommendation 4
   plus a doctor check on the version range.
4. **Flag combination unproven (F31, F32).** One small probe call per role settles it; this report was not
   allowed paid calls. Suggested for R3v or the first implementation task.
5. **`rate_limit_event` on the CLI stream is inferred (F25)** and its richer fields come from a type file, not the
   docs page. R14 should treat `status` and `resetsAt` as stable and the rest as optional.
6. **Budget cap under subscription is inferred (F30).** If it does not hold, the critic's cap at Tier 1 falls back
   to `--max-turns 1` plus the prompt-size budget.
7. **Session continuation and cost**: resumed passes reuse context but prompt-cache lifetime is short, so a pass
   that follows a long verification job may pay full input price again. R21 to R26 should measure this.
8. **Stale evidence citation** in Principle VIII (`proposer.sh:1437` versus `1634-1635`); the amendment should
   fix the line reference or drop it.
9. **Gateway inventory** rests on one fleet note dated 2026-08-19; the doctor should probe the endpoint's model
   list at run time and never assume it.
