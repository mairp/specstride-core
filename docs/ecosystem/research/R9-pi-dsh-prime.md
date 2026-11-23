# R9 — pi, dsh and prime as harnesses

Verified on 2026-09-29 against the installed CLIs (`pi` 0.80.6, `dsh` 0.1.0-rc.8, `prime-agent` 0.7.3 behind the `prime` launcher). No logins, no paid calls, no state changes. Credential and token files were listed by name at most and never opened.

## Prior art consulted

| Source | Used for | Reused / extended / contradicted |
|---|---|---|
| `/root/specstride` at `9cab15d`: `lib/backends.py`, `lib/critic.py`, `proposer.sh`, `lib/prime_stream.py`, `lib/agent_stream.py`, `lib/backend_overlay.py` (read with `git show`) | Today's dsh and prime invocation, tool-less critic recipes, stream adapter | Reused as the parity reference; extended with pi, which has no adapter |
| Installed CLIs: `pi --help`, `pi --list-models`, `dsh --help`, `dsh --profile headless --help`, `prime --help`, `prime --list`, `prime-agent --help`, `prime-agent -v` | Flags, versions | Confirmed; corrects the brief: `prime` (the launcher) has no version flag but `prime-agent -v` prints `0.7.3` |
| Installed package sources and docs under `/usr/lib/node_modules/{@earendil-works/pi-coding-agent,prime-agent,@deepseek-ai/dsh}` | Stream schema, auth mechanism, retry and quota semantics, headless behaviour | New; the docs are the vendor's own, shipped with the installed version |
| `/root/specstride-harness-roadmaps/roadmap/prime-agent-observability.md` | History of the prime stream adapter | Reused; its line numbers refer to an older tree and are not cited |
| `/root/dsh-trace-otel/README.md` | dsh span design, patch mounting, fail-open behaviour | Reused for the dsh observability seam |
| qmd fleet memory (two notes on OpenAI-format models via pi and prime, and on the dsh web UI) | Config homes, one prime gotcha | Reused. A second qmd query timed out after 200 s; nothing further was retrieved |

## Questions answered

**Q1. How is each harness detected and versioned?**
`command -v pi` gives `/usr/bin/pi` and `pi --version` prints `0.80.6`. `command -v dsh` gives `/usr/bin/dsh` and `dsh --version` prints `0.1.0-rc.8`. For prime, `command -v prime-agent` gives `/usr/bin/prime-agent` and `prime-agent -v` prints `0.7.3`. The `prime` launcher (`/usr/local/bin/prime`, a symlink to a shell script) has no version flag. The generic adapter should detect and pin `prime-agent`. Selecting a named variant (`prime <variant>`) belongs to the consumer's local launcher and is not part of the harness contract. [verified-local]

**Q2. Headless invocation and stream format?** See the per-harness findings and the matrix rows. In short: pi and prime-agent are the same lineage and share a JSONL event stream; dsh has no stream at all.

**Q3. Can each run as a tool-less critic?** pi and prime-agent can by flag. dsh can only through a patch file that lists every tool plugin to disable. That is a denylist that goes stale (see F12).

**Q4. Session continuation (decision 22)?** pi and prime-agent support it. dsh headless does not (F10).

**Q5. Quota signals?** Each harness reports provider limits in-band, in a different shape (F13 to F15). None gives an out-of-band remaining-allowance query.

## Findings

### Registry and parity reference (Specstride `9cab15d`)

**F1.** The registry lists `dsh` with optional qualifier `provider/model` and `prime` with optional qualifier `variant`, each for both proposer and critic. pi has no entry. No registry entry sets `stream`, so stream routing is not registry-driven for either. [verified-local: `lib/backends.py:53-60`, field declared at `:41`]

**F2.** Proposer dsh: `dsh --profile headless "<prompt>"`, with the profile taken from `SPECSTRIDE_DSH_PROFILE`, default `headless`. The environment sets `DSH_HOME` (a throwaway overlay when a model is chosen) and `DSH_PERMISSION_MODE` (default `workspace-write`). The prompt is one positional argument. A model choice is written into a throwaway `DSH_HOME` whose entries are symlinks to the real home except `settings.yaml`, because a `--patch` layer loses to the user's `settings.yaml`. [verified-local: `proposer.sh:535-565`, `:407-435`]

**F3.** Proposer prime: `prime-agent -p --mode <text|json> --no-session --cwd <dir>` with the prompt on stdin, or `prime <variant> -p --mode … --no-session --cwd <dir>`. `json` is used when streaming or telemetry is on. `--model` is refused with a variant. [verified-local: `proposer.sh:592-615`, `:322-325`]

**F4.** Critic dsh: same launcher with `--patch <file>` and `DSH_PERMISSION_MODE=read-only`; the patch disables tools by plugin id. Critic prime: `-p --mode <text|json> --no-session --no-tools --no-skills --no-context-files [--cwd]`, prompt on stdin. [verified-local: `lib/critic.py:2093-2160`, `:2188-2206`, `:2251-2266`]

**F5.** Prime exits 0 even when the provider errored, so success is decided by the stream's terminal record, not the exit code. [verified-local: `lib/critic.py:2276`]

### Installed CLIs and vendor docs

**F6. Lineage.** `prime-agent` depends on `@earendil-works/pi-agent-core`, `pi-ai` and `pi-tui`, the same package family as `pi`. Its docs for JSON mode, sessions and provider auth are near copies of pi's. `dsh` uses a `pi-ai` LLM plugin (`dsh-llm-pi-ai`). This lets one adapter family cover pi and prime-agent with a small dialect table (state directories, environment variables, extra events). [verified-local: `/usr/lib/node_modules/prime-agent/package.json:38-40`; `dsh/node_modules/@deepseek-ai/dsh-llm-pi-ai/lib/index.js:2`]

**F7. pi headless and stream.** `pi -p "<prompt>"` (or `--print`) is non-interactive. `--mode text|json|rpc` selects output. In `json` mode the first line is `{"type":"session","version":3,…}` followed by `agent_start`, `turn_start`, `message_start/update/end`, `tool_execution_start/update/end`, `turn_end`, `agent_end`, plus `auto_retry_start/end` and `compaction_start/end`. [verified-local: `pi --help`; `@earendil-works/pi-coding-agent/docs/json.md`]. Prime's JSON schema v3 uses the same type names, and Specstride's adapter already rejects any schema version other than 3. [verified-local: `lib/prime_stream.py:29-36`, `:72-81`]. The pi session header is version 3, the same number; the adapter's `session.version` check may therefore accept pi's stream as is. [inferred from those two facts; not run]

**F8. pi tool control.** `--no-tools`/`-nt` disables all tools; `--tools/-t <list>` is an allowlist; `--exclude-tools/-xt` a denylist; built-ins are `read bash edit write` on by default and `grep find ls` off by default. `--tools read,grep,find,ls` is the documented read-only mode. There is no sandbox or permission prompt in print mode: pi runs with the user's permissions. `--no-skills`, `--no-context-files`, `--no-extensions`, `--no-prompt-templates` and `--no-session` exist. [verified-local: `pi --help`; `docs/security.md`]

**F9. Project trust.** In `-p`, `--mode json` and `--mode rpc` no trust prompt appears; project-local `.pi/` resources are ignored unless `defaultProjectTrust` is `always` or `--approve` is passed. That is the safe default for a critic. [verified-local: `docs/security.md`]

**F10. Session continuation (decision 22).**
- pi: `--continue/-c`, `--session <path|id>`, `--session-id <id>` (exact id, created if missing), `--fork`, `--session-dir`, `--no-session`. `--session-id` lets the runtime pick a deterministic id per attempt and continue by id, without depending on "most recent". [verified-local: `pi --help`]
- prime-agent: `-c`, `-r [path|id]`, `--fork`, `--session-dir`, `--no-session`. The local launcher gives each variant its own session directory. [verified-local: `prime-agent --help`; `/root/prime-agent/prime.sh:306,407`]
- dsh headless: every run creates `session-<uuid>` for a fresh agent, takes only the task positional, and has no resume or model flag. Sessions are persisted under `$DSH_HOME/sessions`, but the headless app cannot reopen one. The `--resume <session>` example in `dsh --help` targets a `tui` profile that does not exist on this machine (only `headless` and `web`). Continuation is therefore not available; context must go through files. [verified-local: `dsh-headless/lib/index.js:58-98`, `startup.js`; `dsh --profile tui` error; `ls /root/.dsh/profiles`]

**F11. dsh headless output.** It prints only the final assistant text plus a newline on stdout. On a non-completed outcome it also writes `dsh: <CODE>: <message>` to stderr and exits 1; completed exits 0. No token usage, tool events or model name are emitted. Structured observability needs the trace plugin (`dsh-trace-otel`, OpenInference spans to a collector). [verified-local: `dsh-headless/lib/index.js:96-98`; `/root/dsh-trace-otel/README.md`]

**F12. dsh permissions and tool-less critic.** `DSH_PERMISSION_MODE` takes `read-only`, `workspace-write` (default) or `danger-full-access`; approval is `ask` except in full access, where it is `never`. What "ask" does in a headless run with no human is not documented in what I read. [verified-local: `dsh-base/cordis.patch.yml:175,191-207`; approval-in-headless behaviour: unverified, no run made]. The tool-less critic disables about 20 tool ids (`tool-bash`, `tool-fs`, `tool-web`, `tool-subagent*` and others) by patch. Any tool plugin added in a later dsh release would be on by default. This is a denylist and, per decision 17, a fragile one. [verified-local: `lib/critic.py:2093-2140`; inferred for the drift risk]. Read-only mode is a second layer, not a replacement.

**F13. Quota and limit signals, dsh.** The LLM layer defines error codes including `QUOTA`, `RATE_LIMIT`, `CONTEXT_WINDOW_EXCEEDED` and `INVALID_CREDENTIAL`. A retry plugin (`llm-retry`) retries per provider policy. A headless failure surfaces as `dsh: QUOTA: …` on stderr, and today's critic notes that dsh reports some provider failures on stdout, so both streams must be scanned. [verified-local: `dsh-llm/lib/index.js:257,1526`; `dsh-llm-retry/lib/index.js`; `lib/critic.py:2168-2173`]

**F14. Quota and limit signals, pi and prime-agent.** A provider error appears in the stream as an assistant message with `stopReason: "error"` and `errorMessage`, or an `error` record, and is preceded by `auto_retry_start`/`auto_retry_end`. `retry.provider.maxRetryDelayMs` (default 60 000) makes pi fail at once, with the provider's text (for example "quota will reset after 5h"), when the server-requested delay exceeds the cap. That text carries the reset time, which suits the pause-and-resume design of decision 8. [verified-local: `docs/settings.md:138-147`; `lib/prime_stream.py:217-220,307-330`]. The adapter labels auth errors by regex over the message. It has no dedicated quota code today. [verified-local: `lib/prime_stream.py:28`]. Whether pi's exit code is non-zero on a provider error is unverified (no call made). Prime's is 0 (F5).

**F15. Subscription-quota exposure.** No remaining-allowance query exists for any of the three. With an API key the spend is measurable from usage in the stream (pi and prime: per message; dsh: not exposed). With a subscription login the only trigger is the provider's limit error. [inferred from F11, F14]

**F16. Auth and config homes (mechanisms only).**

| Harness | Config home | Credential mechanism | Overrides |
|---|---|---|---|
| pi | `~/.pi/agent` (holds settings, models, sessions, extensions, an auth file, a trust file) | Provider API keys from environment variables (a long list, including `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `ZAI_API_KEY`), or an auth file written by `/login`; the OAuth login covers ChatGPT Plus/Pro, Claude Pro/Max and GitHub Copilot | `PI_CODING_AGENT_DIR`, `PI_CODING_AGENT_SESSION_DIR`, `--session-dir`, `--api-key` (per run), `PI_OFFLINE`, `PI_TELEMETRY` |
| prime-agent | `~/.prime/agent` | Same shape as pi, in its own auth file; `--api-key` per run | `PRIME_AGENT_SESSION_DIR`, `--session-dir`, `PRIME_AGENT_TELEMETRY=0`, `DO_NOT_TRACK=1`, `--offline` |
| dsh | `$DSH_HOME`, default `~/.dsh` (settings, a credentials file, profiles, sessions, storages) | Credentials stored by dsh in its own credentials file; provider chosen by `agent-default-model` in settings | `DSH_HOME` (a whole alternative home), `--patch` overlay files, `DSH_PERMISSION_MODE`, `DSH_TELEMETRY_MODE` |

[verified-local: `pi --help`; `pi/docs/providers.md:14-31,81-85`; `prime-agent/docs/providers.md:14-31`; `prime-agent/docs/settings.md:70-95`; `/root/.dsh` listing; `/root/dsh-trace-otel/README.md`]. No credential file was opened.

**F17. Terms and telemetry notes (R8 owns the ruling).**
- pi and prime-agent docs state that Claude Pro/Max login used through a third-party harness draws from "extra usage" billed per token, not from plan limits. That describes a tier 3 path and must stay behind the terms gate. [verified-local: `pi/docs/providers.md:29-31`; not rechecked against the provider's current terms]
- Both CLIs are MIT-licensed; dsh's package declares MIT. [verified-local: package.json files]
- pi sends an anonymous install/update ping unless disabled (`enableInstallTelemetry`, `PI_TELEMETRY=0`). Prime-agent enables pseudonymous usage telemetry by default; `PRIME_AGENT_TELEMETRY=0`, `DO_NOT_TRACK=1` or `--offline` turn it off. A Specstride-launched subprocess should set these off by default, since the user did not opt in. [verified-local: `pi/docs/settings.md:60`; `prime-agent/docs/settings.md:70-95`]

**F18. Context windows.** None of the three reports a window from a flag; each takes it from the configured model. `pi --list-models` prints a `context` column per configured model and `prime-agent model list` lists models. Today's critic keeps a hand-maintained table and a default of 98 304 tokens for prime, whose backing model it cannot see. The table's own history records a real failure: a declared window of 300 000 tokens overshot a gateway's effective 200 000, the call died `CONTEXT_WINDOW_EXCEEDED`, and it was read as MALFORMED and burned an attempt. Rule for the adapter descriptor: use the smaller of the declared and the effective window, and let the descriptor and the doctor override it. [verified-local: `pi --list-models` (columns and values vary per configured model); `lib/critic.py:129-146,301-315`]

Declared windows seen on this machine (model-specific, config-derived): 128 000 to 256 000 tokens for the locally served and gateway models; the vendor windows for Claude and Codex are outside this report. [verified-local: `pi --list-models`]

**F19. Prime's safety posture.** `prime` prints "NOT A SANDBOX": its IPython kernel runs model-generated code with full host permissions. A proposer on prime therefore has no permission mode to lower; the only controls are `--tools` allowlists and the throwaway home. [verified-local: `prime --help`; `prime-agent --help`]

**F20. Gotcha for prime's model config.** Marking a gateway's OpenAI-format model as `reasoning: true` in prime's provider config makes prime send a reasoning-control payload the gateway rejects, surfacing as a misleading "invalid input model" error; pi avoids it with `compat.supportsReasoningEffort:false`. The doctor cannot check this. [unverified: reported in a fleet memory note dated 2026-08-19 (qmd); not reproduced here, no model call made]

## Version/date pins

| Harness | Proposed pin (range) | Verified on | Basis |
|---|---|---|---|
| pi | `>=0.80.6 <0.81` | 2026-09-29 | Installed version; flags and JSON docs read from the installed package. Not run end-to-end, so the pin is provisional until a fixture capture exists |
| prime-agent | `>=0.7.3 <0.8` (schema v3) | 2026-09-29 | `prime-agent -v`; adapter requires stream schema version 3 |
| dsh | `==0.1.0-rc.8` (exact) | 2026-09-29 | Pre-release; the trace plugin says it tracks an rc seam and needs re-testing after any upgrade. The doctor should warn on any other version |

## Options compared

Choice: how to implement the three adapters (decision 17: evolvable; decision 10: pinned).

| Option | Evolvability | Cost | Risk |
|---|---|---|---|
| A. Three bespoke adapters | Low; three code paths | High | Duplicated stream and quota logic |
| B. One "pi-family" JSONL adapter with a dialect table (pi, prime-agent), plus a text-only adapter for dsh | High; a new pi-derived harness is a table row | Medium | Dialects may diverge; needs fixtures per harness |
| C. Generic descriptor only, no tested adapters | Highest | Lowest | Loses the pins, the quota parsing and the tool-less critic guarantees; harnesses would be "unverified" |

## Recommendation

Option B, delivered in later waves after Wave 1 (decision 13), each adapter through the R20 descriptor format:
1. A pi-family adapter covering pi and prime-agent: `-p --mode json`, prompt on stdin (or `@file`), `--no-session` for the critic and for proposer passes that cannot continue, and the existing schema-v3 parser as the base. Allowlist tools with `--tools`, not denylists. Critic: `-p --mode json --no-session --no-tools --no-skills --no-context-files --no-extensions --no-prompt-templates` (flag set proven for prime; the same flags exist in pi's help).
2. Continuation in a proposer attempt via pi's `--session-id <attempt-id>` and prime's `-c`/`-r` inside a per-run `--session-dir`. A new attempt or a critic never continues.
3. A dsh text adapter: `dsh --profile headless "<task>"`, final text on stdout, error text on stderr, no continuation, no streaming, no usage. Treat dsh as file-context only. The critic path stays a patch-based denylist, marked as such; the doctor should compare the plugin ids the installed dsh exposes with the disable list and warn on any not covered.
4. Launch every subprocess with harness telemetry off and, where the runtime owns it, a throwaway home or session directory.

Confidence: medium-high on the invocations (read from source and docs); medium on pi's behaviour, because it has never been run in Specstride and no fixture exists.

## Matrix rows

Columns: harness; tested or unverified; detect/version; headless invocation; stream format; TS SDK; auth modes; tier; proposer?; tool-less critic?; quota signal; terms status; version pin + verified-on; delivery wave.

| Harness | Tested? | Detect / version | Headless | Stream | TS SDK | Auth | Tier | Proposer? | Tool-less critic? | Quota signal | Terms | Pin + verified-on | Wave |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pi | unverified (no adapter; help and docs read only) | `command -v pi`; `pi --version` = 0.80.6 | `pi -p --mode json "<prompt>"` (stdin or `@file` also accepted); add `--no-session` or `--session-id <id>` | JSONL, session header v3, `message_*`, `tool_execution_*`, `auto_retry_*`, `agent_end` | yes: the package documents `sdk.md` and `rpc.md` (not exercised) | provider env keys or auth file (API key); OAuth login for Codex, Claude Pro/Max, Copilot | 1 with a key or a provider account; OAuth Claude path is tier 3 (R8 rules) | yes; no permission mode, runs as the user; continuation by `--session-id`/`-c` | yes by flags (`--no-tools --no-skills --no-context-files --no-extensions --no-session`); unverified by run | in-stream `stopReason:error` + `errorMessage`; `auto_retry_*`; long provider delays fail fast with reset text; exit code unverified | MIT; R8 rules on subscription paths | `>=0.80.6 <0.81`, 2026-09-29 | later wave, one feature |
| dsh | tested (Specstride `9cab15d`, proposer and critic) | `command -v dsh`; `dsh --version` = 0.1.0-rc.8 | `dsh --profile headless "<task>"`, with `DSH_HOME`, `DSH_PERMISSION_MODE` | none: final assistant text on stdout; `dsh: CODE: msg` on stderr; exit 0 or 1 | unverified | credentials held in dsh's own home; provider set in settings `agent-default-model` | 1 (own configured provider) | yes; `DSH_PERMISSION_MODE`; no continuation, no model flag (needs a throwaway `DSH_HOME` overlay) | yes, by a `--patch` denylist of tool ids plus `read-only` mode (stale-prone) | error codes `QUOTA`, `RATE_LIMIT`, `CONTEXT_WINDOW_EXCEEDED`, `INVALID_CREDENTIAL` on stderr/stdout | MIT | `==0.1.0-rc.8`, 2026-09-29 | Wave 2 (as host, R4) and a later adapter wave |
| prime (prime-agent) | tested (Specstride `9cab15d`, proposer and critic, stream v3) | `command -v prime-agent`; `prime-agent -v` = 0.7.3; the `prime` launcher has no version flag | `prime-agent -p --mode json --no-session --cwd <dir>` prompt on stdin | JSONL schema v3 (same event names as pi) | unverified (docs mention `sdk.md`) | provider env keys or auth file; `--api-key` per run; OAuth login as pi | 1 | yes; NOT a sandbox, no permission mode; continuation by `-c`/`-r`/`--session-dir` | yes: `--no-tools --no-skills --no-context-files --no-session` (in Specstride's critic) | in-stream error record; the process exits 0 on provider error, so read the terminal record | MIT; telemetry on by default, disable it | `>=0.7.3 <0.8`, schema 3, 2026-09-29 | later wave, one feature |

## Open questions / risks

1. `DECISIONS-PENDING` candidate (decision 22 and Principle VIII): dsh headless cannot continue a session at all. Evidence: `dsh-headless/lib/index.js:58-98` creates a fresh session per run. Default: treat dsh as fresh-per-pass with file-carried context. If the owner rules that every proposer must continue, dsh would be ineligible as proposer in an attempt with several passes, or would need a dsh-side change.
2. Risk for decision 17 and Principle IX: dsh's tool-less critic depends on a denylist of tool plugin ids. A new dsh release can add an enabled tool. Mitigation: exact version pin plus a doctor check. An allowlist mechanism in dsh would remove the risk; none was found.
3. Prime exits 0 on a provider error (F5), so quota pause (decision 8) must key on the terminal record. Same check needed for pi; unverified.
4. Unverified: what dsh's approval `ask` does in a headless proposer run (F12); pi's exit code on provider error; whether `--session-id` combined with `-p --mode json` behaves as documented; pi's stream against the schema-v3 parser. One small fixture capture per harness (a scripted stub or one cheap call, allowed only in a later, explicitly authorized probe) would close all four.
5. Declared versus effective context window (F18) is a proven failure mode; the descriptor needs an override field and the doctor a check.
6. Overlap: R4 owns dsh as a host, R8 the Claude Pro/Max terms question, R14 quota design, R20 the descriptor format. This report supplies inputs only.
7. Machine-specific launcher: the `prime` variant launcher and its variant registry are specific to the owner's machines and are excluded from the adapter contract; the contract targets `prime-agent` with `--provider/--model` flags.
