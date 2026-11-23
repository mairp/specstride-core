# R3v — host facts verification

Independent check of the host and CLI facts in `R3-claude-code-host.md` and `R5-claude-proposer-critic.md`
against the installed `claude` CLI and the current official documentation. Date: 2026-09-29.
Installed CLI: `2.1.284 (Claude Code)`, binary `/usr/lib/node_modules/@anthropic-ai/claude-code/bin/claude.exe`.

No model call, no login, no install, no state change, no credential file read. No paid probes.

Tags used: `verified-local` (help output or a string in the installed binary), `verified-doc` (raw Markdown
of the official page, URL given, accessed 2026-09-29), `inferred`, `unverified`.

Summary: 102 table rows checked (37 flag, 38 plugin and eval, 27 doc-only); 90 confirmed, 7 corrected
(C1 to C7), 5 could not be confirmed by this check (P30, D18, D19, D26, D27). No flag named in R5's critic or proposer command is missing from the installed CLI.
Two of them (`--max-turns`, `--system-prompt-file`) are hidden from `--help` but registered in the binary.
The largest correction is to R3: `--exec` **does** exist (documented, and handled in the installed binary),
it is only hidden from `--help`.

## Method

Commands run (all read-only introspection):

| Command | Purpose |
|---|---|
| `claude --version` | Version pin: `2.1.284 (Claude Code)` |
| `claude --help` | Top-level flags and commands |
| `claude -p --help` diffed against `claude --help` | Whether print mode has its own help: option lists are identical; `-p --help` only omits the `Commands:` block |
| `claude plugin --help` | Plugin subcommands |
| `claude plugin <eval, details, validate, install, init, tag, list, marketplace, uninstall, update, enable, disable, prune> --help` | Subcommand options |
| `claude plugin eval init --help`, `claude plugin marketplace <add, list, remove, update> --help` | Nested options |
| `claude plugin list`, `claude plugin details autoharness` | Read-only listing of the two installed (disabled) plugins; `details` output format |
| `claude <agents, attach, logs, stop, respawn, rm, daemon, auth, setup-token> --help` | Background-session and auth commands (help only) |
| `grep -a` (fixed strings and short regex) on the installed binary | Existence of flags that `--help` hides, and of message strings. Read-only. |
| `curl https://code.claude.com/docs/en/<page>.md` into `/tmp/specstride-research/R3v/docs/` then `grep -n` | Raw doc text, not summarised. Pages: `cli-reference`, `headless`, `hooks`, `permission-modes`, `agent-view`, `plugin-evals`, `plugin-marketplaces`, `plugins/components`, `plugins/manifest-reference`, `plugins/marketplace-reference`, `plugins/loading`, `skills`, `errors`, `authentication`, `agent-sdk/overview`, `agent-sdk/typescript` |

Limits of the method:

- `--help` is not a complete flag list. The CLI reference says so: "`claude --help` does not list every flag,
  so a flag's absence from `--help` does not mean it is unavailable" (`cli-reference.md:56`, `verified-doc`).
  For a flag absent from help I therefore looked for its option registration in the installed binary.
- A string in the binary proves the flag is parsed, not how it behaves. Behaviour of hidden flags and all flag
  **combinations** remain untested; that needs one live call per role, which this assignment forbids.
- Rule applied on disagreement: the installed CLI stands.

## Flag-by-flag results

"In help" = appears in `claude --help` of 2.1.284. Help text is quoted or shortened from that output.

| # | Claim | Source | In installed CLI? | Help text (2.1.284) | Verdict |
|---|---|---|---|---|---|
| 1 | `--session-id <uuid>` sets the session id | R5 Q2, Q4, F7; R3 F11 | Yes, in help | "Use a specific session ID for the conversation (must be a valid UUID)" | Confirmed. Must be a valid UUID. |
| 2 | `--resume <session-id>` resumes by id | R5 Q4 | Yes, in help, as `-r, --resume [value]` | "Resume a conversation by session ID, or open interactive picker with optional search term" | Confirmed. Note the value is **optional**: with no value an interactive picker opens, so the adapter must never emit a bare `--resume`. Docs add that an id is searched in every project on the machine since v2.1.223 (`cli-reference.md:123`, `verified-doc`), confirming R5 F14. |
| 3 | `--continue` picks the most recent conversation in the cwd; with `-p` it includes `-p`, SDK and `/loop` sessions | R5 Q4, F13 | Yes, in help, as `-c, --continue` | "Continue the most recent conversation in the current directory" | Confirmed (help for the first half, `cli-reference.md:78` for the `-p` half). R5's "never use" rule stands. |
| 4 | `--fork-session` exists | R5 Q2, F7 | Yes, in help | "When resuming, create a new session ID instead of reusing the original (use with --resume or --continue)" | Confirmed. |
| 5 | `--tools ""` disables all built-in tools | R5 Q2, F5 | Yes, in help, as `--tools <tools...>` | "Use \"\" to disable all tools, \"default\" to use all tools, or specify tool names" | Confirmed. Variadic: it consumes following bare arguments, so it must be followed by another flag (R5's command does this) and the prompt must go on stdin. |
| 6 | `--tools` does not affect MCP tools; `--disallowedTools "mcp__*"` removes them | R5 F5 | Flag in help; the MCP statement is not | Help says only "from the built-in set" | Confirmed by doc (`cli-reference.md:135`, `:84`). Help is consistent ("built-in set"). Doc caveat R5 omits: `""` removes the `EndConversation` tool "only when no MCP tools remain". |
| 7 | `--disallowedTools` spelling | R5 Q2 | Yes, in help, as `--disallowedTools, --disallowed-tools <tools...>` | "Comma or space-separated list of tool names to deny" | Confirmed, camelCase and kebab-case both accepted. Variadic, same caution as row 5. |
| 8 | `--allowedTools` auto-approves, does not restrict | R5 F6; R3 ledger | Yes, in help, as `--allowedTools, --allowed-tools <tools...>` | "list of tool names to allow" | Help text is ambiguous; doc confirms R5 ("To restrict which tools are available, use `--tools` instead", `cli-reference.md:65`). Confirmed `verified-doc`. |
| 9 | `--strict-mcp-config` ignores all MCP config except `--mcp-config` | R5 Q2, F7 | Yes, in help | "Only use MCP servers from --mcp-config, ignoring all other MCP configurations" | Confirmed. |
| 10 | `--safe-mode` disables CLAUDE.md, skills, plugins, hooks, MCP, agents, auto memory; auth unchanged | R5 Q2, F11 | Yes, in help | "Start with all customizations (CLAUDE.md, skills, installed plugins, hooks, MCP servers, custom commands and agents, output styles, workflows, custom themes, keybindings, and more) disabled ... Admin-managed (policy) settings still apply. Auth, model selection, built-in tools and plugins, and permissions work normally. Sets CLAUDE_CODE_SAFE_MODE=1." | Confirmed with two qualifications. (a) "auto memory" is not in the help list; it is in the doc row (`cli-reference.md:124`), so that part is `verified-doc`. (b) Managed-policy settings, **including policy-configured hooks**, still apply; on a managed machine the critic is not hook-free. Built-in plugins also stay. |
| 11 | `--no-session-persistence` | R5 Q2, Q4, F7 | Yes, in help | "sessions will not be saved to disk and cannot be resumed (only works with --print)" | Confirmed. |
| 12 | `--max-budget-usd <n>` | R5 Q2, F7, F15 | Yes, in help | "Maximum dollar amount to spend on API calls (only works with --print)" | Flag confirmed. Help wording "API calls" neither confirms nor denies enforcement under a subscription login, so R5 F30 stays `inferred`. Resume behaviour confirmed by doc (`cli-reference.md:102`). |
| 13 | `--max-turns 1` | R5 Q2, F8 | **Not in help.** Registered in the binary as a hidden option: `new Option("--max-turns <turns>","Maximum number of agentic turn...` preceded by `.hideHelp()` | none | Confirmed as R5 stated it (F8: documented, absent from help). Upgraded from doc-only to `verified-local` for existence. Doc: "Limit the number of agentic turns (print mode only). Exits with an error when the limit is reached" (`cli-reference.md:103`). |
| 14 | `--system-prompt-file <file>` | R5 Q2, F8 | **Not in the option list of help**, but named inside the `--bare` help text (`--system-prompt[-file]`). Registered in the binary: `"--system-prompt-file <file>","Read system prompt from a file"` | none of its own | Confirmed as R5 stated it. Existence `verified-local`. Mutually exclusive with `--system-prompt` (`cli-reference.md:152`). |
| 15 | `--append-system-prompt-file` | R5 Q3 | Same as row 14: named in `--bare` help text, no own entry; string present in binary | none of its own | Confirmed (`cli-reference.md:69`). |
| 16 | `--bare` skips hooks (incl. plugin hooks), plugins, MCP, CLAUDE.md, auto memory; sets `CLAUDE_CODE_SIMPLE=1`; auth only `ANTHROPIC_API_KEY` or `apiKeyHelper` | R5 Q3, F9; R3 F2, F11 | Yes, in help | "Minimal mode: skip hooks (those defined in settings and by installed plugins ...), LSP, plugin sync, attribution, auto-memory, background prefetches, keychain reads, and CLAUDE.md auto-discovery. Sets CLAUDE_CODE_SIMPLE=1. Anthropic auth is strictly ANTHROPIC_API_KEY or apiKeyHelper via --settings (OAuth and keychain are never read). ... Skills still resolve via /skill-name." | Confirmed. One nuance: help does not list skills, subagents or MCP servers among the things skipped, and says "Skills still resolve via /skill-name"; the doc row lists skills, custom commands, subagents, installed plugins and MCP servers as not auto-discovered (`cli-reference.md:72`). Both can be true (no auto-discovery, explicit invocation still resolves). R5's list is the doc's list. |
| 17 | `--permission-mode dontAsk` / `acceptEdits` / `auto` | R5 Q2, Q7 | Yes, in help | choices: `acceptEdits`, `auto`, `bypassPermissions`, `manual`, `dontAsk`, `plan` | Confirmed for all three values R5 uses. Note: help lists `manual`, **not** `default`; doc says `default` is still accepted and `manual` is its alias (`cli-reference.md:110`). An adapter that validates against help output must not reject `default`. |
| 18 | `--permission-prompts none` | R5 Q2, Q7; R3 F11 | Yes, in help, as `--permission-prompts <target>` | "Who answers permission prompts with --print: \"host\" ... or \"none\" (nobody: anything that would prompt is denied automatically; the permission mode still decides everything else) (choices: \"host\", \"none\", default: \"host\")" | Confirmed, matches R5's description. Floor v2.1.259 confirmed by doc. |
| 19 | `--output-format stream-json` | R5, R3 | Yes, in help | choices `text`, `json`, `stream-json`; "only works with --print" | Confirmed. |
| 20 | Streaming needs `--verbose` | R5 prior art, Q5 | `--verbose` in help: "Override verbose mode setting from config". The requirement is not in help | — | Confirmed `verified-local` from the binary's error string: "Error: When using --print, --output-format=stream-json requires --verbose". |
| 21 | `--input-format` | task list; R3 F11 | Yes, in help | choices `text` (default), `stream-json`; "only works with --print" | Confirmed. |
| 22 | `--model <model>` | R5 Q2 | Yes, in help | "Provide an alias for the latest model (e.g. 'fable', 'opus', or 'sonnet') or a model's full name" | Confirmed. |
| 23 | `--setting-sources <sources>` | R5 Q7, F7, F32 | Yes, in help | "Comma-separated list of setting sources to load (user, project, local)." | Confirmed. Acceptance of an empty value (R5 F32) cannot be read from help: stays `unverified`. |
| 24 | `--settings <file-or-json>` | R5 Q5; R3 F11 | Yes, in help | "Path to a settings JSON file or a JSON string to load additional settings from" | Confirmed. |
| 25 | `--disable-slash-commands` | R5 Q2, Q7 | Yes, in help | "Disable all skills" | Confirmed. Doc: "Disable all skills and commands for this session". |
| 26 | `--restricted` ignores user/project/local settings and removes command-running tools | R5 Q2, F7 | Yes, in help | "removes the built-in tools that run commands or code (Bash, PowerShell, REPL ...) and WebFetch unless --tools names them, and ignores user, project and local settings files (managed settings and --settings still apply; add --strict-mcp-config to skip MCP servers too). Also confines the file tools to the working directories ..., refuses bypassPermissions ..." | Confirmed. Floor v2.1.248 confirmed by doc. Help itself names the `--strict-mcp-config` combination, which supports (does not prove) part of R5 F31. |
| 27 | `--system-prompt-snapshot <on\|off>`; bare mode turns recording off unless `on` | R5 Q3, F7, F16 | Yes, in help | "Record the system prompt once per conversation and reuse it verbatim on every request and resume. on (the default) ..." | Confirmed (help plus `cli-reference.md:160-166`). |
| 28 | `--fallback-model` | R5 F7; R3 F11 | Yes, in help | "Accepts a comma-separated list to try each in order" | Confirmed. |
| 29 | `--dangerously-skip-permissions` | R5 Q7 | Yes, in help | "Bypass all permission checks. Recommended only for sandboxes with no internet access." | Flag confirmed. Root refusal: see Doc-only claims D6. |
| 30 | `--json-schema`, `--effort`, `--append-system-prompt`, `--include-hook-events`, `--forward-subagent-text`, `--include-partial-messages` | R3 F11 | Yes, all in help | `--effort` levels: low, medium, high, xhigh, max | Confirmed. |
| 31 | `--plugin-dir <dir\|zip>`, `--plugin-url` | R3 F3 | Yes, in help | "Load a plugin from a directory or .zip for this session only; a folder of plugins loads each child (repeatable)" | Confirmed. |
| 32 | `--mcp-config`, `--agents`, `--add-dir` (context re-entry under `--bare`) | R5 Q3 | Yes, in help | — | Confirmed. |
| 33 | `--bg` / `--background` | R3 F1, F5, F6 | Yes, in help | "Start the session in the background and return immediately. Prints the id that `claude attach`, `logs`, `stop` and `rm` take ..." | Confirmed. |
| 34 | **`--exec` does not exist ("not in `claude --help` and not in docs")** | R3 Q3, F5, ledger | **Not in help. Present in the binary and in the docs.** Binary strings: `--exec requires a command.`, `warning: --exec ignores ... (only --name composes)`, and an argv scan for `"--exec"` / `"--exec="`. | none | **Corrected.** See "Corrections that stand" C1. |
| 35 | `--init-only`, `-p --init`, `-p --maintenance` trigger the `Setup` hook | R3 F2, ledger | Not in help; `--init-only` and `--maintenance` strings present in the binary | none | Confirmed by doc (`cli-reference.md:95,96,101`; `hooks.md:38`). Existence `verified-local` by string only. |
| 36 | `--permission-prompt-tool` (named inside the `--permission-prompts` help) | implicit | Not in the option list; named in help text; string in binary | — | Exists, hidden. Not used by either report. |
| 37 | `claude auth status`, `claude setup-token` | R5 matrix row, Q7 | Yes | `auth`: login, logout, status. `setup-token`: "Set up a long-lived authentication token (requires Claude subscription)" | Confirmed. |

No flag in either report is absent from the installed CLI. Four are hidden from `--help`
(`--max-turns`, `--system-prompt-file`, `--append-system-prompt-file`, `--exec`), plus the `Setup` triggers.

## Plugin and eval claims

| # | Claim (source) | Evidence | Verdict |
|---|---|---|---|
| P1 | `claude plugin` subcommands (R3 F3) | `claude plugin --help` lists: `details`, `disable`, `enable`, `eval`, `init\|new`, `install\|i`, `list`, `marketplace`, `prune\|autoremove`, `tag`, `uninstall\|remove`, `update`, `validate` | Confirmed `verified-local`. R3 does not mention `prune`, `enable`, `disable`, `update`; no claim is contradicted. |
| P2 | `claude plugin validate --strict`, `--json` (R3 F1) | help: `--json`, `--strict` "Treat warnings as errors (exit 1)" | Confirmed. |
| P3 | `claude plugin install <plugin>@<marketplace> [--config k=v] [-s user\|project\|local] [--json] [-y]` (R3 F3) | help lists all of these, plus `--accept-command <sha256>` and `--registry <url>` | Confirmed. New fact: help describes a direct `<package>@npm` install with `--registry`, relevant to packaging option A'. |
| P4 | `claude plugin init <name>` scaffolds `~/.claude/skills/<name>/` (R3 F3) | help: "Scaffold a new plugin at ~/.claude/skills/<name>/ (auto-loads next session as <name>@skills-dir)" | Confirmed. |
| P5 | `claude plugin tag` creates `{name}--v{version}` (R3 F3) | help, with `--dry-run`, `-f`, `-m`, `--push`, `--remote` | Confirmed. |
| P6 | `claude plugin marketplace add\|list\|remove\|update` (R3 F3) | help | Confirmed. `add` takes "a URL, path, or GitHub repo", options `--claudeai`, `--scope`, `--sparse`. |
| P7 | `claude plugin details` has no `--json` (R3 F3) | help lists only `-h` | Confirmed. |
| P8 | `details` prints "Always-on: ~N tok" and a per-component on-invoke column; hooks "harness-only — no model context cost"; 138 tokens for a plugin with 1 skill + 2 agents (R3 F1, F3, F4) | `claude plugin details autoharness` output: `Hooks (4) ... (harness-only — no model context cost)`, `Always-on: ~138 tok`, columns `component always-on on-invoke` | Confirmed verbatim. Also prints "MCP servers ... (tool schemas resolved at runtime; not counted)", so the projected figure excludes MCP schemas. |
| P9 | Two disabled third-party plugins installed (R3 F3) | `claude plugin list` | Confirmed. |
| P10 | `--plugin uninstall --keep-data` preserves `~/.claude/plugins/data/{id}/` (R3 F7) | `claude plugin uninstall --help` | Confirmed. |
| P11 | Eval flags: `--trust-plugin`, `--model`, `--judge-model`, `--threshold` (default 1.0), `--max-cost-usd`, `-j 1..8`, `--runs` (default 3), `--case`, `--tag`, `--ablation none\|with-without`, `--allow-tools`, `--scaffold`, `--json [path]` (R3 F10) | `claude plugin eval --help` lists every one with the stated defaults; judge default "haiku"; `-j` "1-8; default 1 ... share one rate limit" | Confirmed `verified-local`. Flags R3 does not list: `--eval-dir`, `--output-dir`, `--report`, `--no-publish`, `--publish-report`, `--mocks record\|off`, `--allow-real-servers`, `--no-scaffold`, `--keep-temp`, `--verbose`. |
| P12 | Ablation default is `with-without` (R3 F10) | help: "default: with-without whenever a plugin resolves ... and none when nothing does" | Confirmed with a condition: the default is `none` when no plugin resolves from the target. |
| P13 | `tool_used: Skill` graders are indicators, not scored, in a two-arm run (R3 F10) | help (`--ablation`): "graders marked with-only, incl. `tool_used: Skill`, are a plugin-fired indicator rather than part of the score"; doc `plugin-evals.md:241-249` | Confirmed. Doc adds an exception R3 omits: if **every** grader in a case is in the excluded set they are scored normally. A trigger-only case with a single `tool_used Skill` grader is therefore scored, in both arms. |
| P14 | Six grader types; four free, two paid; three judge calls (R3 F10) | Not in help. Doc `plugin-evals.md:216`, `:595-600`, `:46` | Confirmed `verified-doc`. `llm` passes on two of three votes. |
| P15 | Exit codes 0, 1, 2, 143 (R3 F10, matrix row) | Help shows only "Exit 1 if any case score is below this threshold" and "(exit 2)" for the cost ceiling. Doc table `plugin-evals.md:408-414` lists 0, 1, 2, **130**, 143 | **Corrected**: exit code 130 ("Interrupted. Partial results are written") is missing from R3. See C3. |
| P16 | `--trust-plugin` mandatory when `CI` is set or no TTY, else exit 1 (R3 F10) | help: "for CI"; doc `plugin-evals.md:636`, `:411` | Confirmed; doc adds that passing `--json` also suppresses the prompt and so also needs it. |
| P17 | `--max-cost-usd` hit gives exit 2 and partial results (R3 F10) | help: "abort and report partial results if hit (exit 2). The ceiling is checked before each run launches, so overrun is bounded to the runs in flight" | Confirmed. The cap can be overrun by up to `--concurrency` runs. |
| P18 | Needs v2.1.269+, git check since v2.1.283 (R3 F10) | doc `plugin-evals.md:29`, `:650` | Confirmed `verified-doc`. |
| P19 | `max_turns` default 10, `timeout_seconds` default 300, `schema_version: "1.1"` (R3 F10) | doc `plugin-evals.md:545-546`, `:276` | Confirmed. Maxima: 200 turns, 3600 s. |
| P20 | Each run is a `claude -p` child with a temp HOME and only the plugin loaded (R3 F10) | doc `plugin-evals.md:495`; help: "Each run is a full claude child on your own credential" | Confirmed. |
| P21 | Output file `aggregate-result.json` (R3 F10) | help `--output-dir`: "Directory for aggregate-result.json (default: ./<eval dir>/results/<timestamp>/)" | Confirmed `verified-local`. The doc's exit-code table calls the file `results.json` (`plugin-evals.md:412`); the installed CLI's name stands. |
| P22 | Usage limit mid-suite scores later runs 0 without `partial` (R3 F10) | doc `plugin-evals.md:700` | Confirmed. |
| P23 | `claude plugin eval init --bare <name>` (R3 F10) | `claude plugin eval init --help` | Confirmed. Without `--bare` it runs an interview that calls the model. |
| P24 | Marketplace plugin source types: relative path, `github`, `url`, `git-subdir`, `npm`, `archive`, `command` (R3 F3, ledger) | doc `plugins/marketplace-reference.md:139-144`, `:157` | Confirmed `verified-doc`. `archive` v2.1.224+, `command` v2.1.229+ confirmed. |
| P25 | Reserved marketplace names include `npm`, `github`, `inline` (R3 F3) | doc `plugins/marketplace-reference.md:48-49` | Confirmed. |
| P26 | npm **plugin** source is usable for packaging option A' (R3 F9, recommendation 1) | doc `plugins/marketplace-reference.md:142` (plugin source `npm` works); same page `:349`: an `npm` **marketplace** source "Fails to load: `NPM marketplace sources not yet implemented`" | Confirmed, with a boundary R3 does not state: the marketplace itself cannot be delivered from npm; only a plugin entry inside a git, URL or local marketplace can point at npm. See Open questions. |
| P27 | npm-source plugin version resolves to `unknown` unless the manifest sets `version` (R3 F1, F8) | doc `plugins/loading.md:281` | Confirmed. |
| P28 | Dependency install `npm ci --ignore-scripts`, 60 s, shrinkwrap for npm source, old versions removed after 14 days (R3 F3, F8) | doc `plugins/loading.md:193`, `:217-237` | Confirmed. |
| P29 | `bin/` is on the Bash tool's PATH, after the user's PATH; claude's web app and Cowork do not install a plugin with top-level `bin/` (R3 F1) | doc `plugins/components.md:876`, `:885`, `:887` | Confirmed `verified-doc`. Not checkable from help. |
| P30 | `bin/` is not on the PATH of hook processes (R3 F1, tagged unverified by R3) | doc says only "the `PATH` of the Bash tool's shell" | Still `unverified`. R3's use of `"${CLAUDE_PLUGIN_ROOT}/bin/specstride"` in hooks is the safe form. |
| P31 | `userConfig`: `sensitive` to credential store, `options` needs v2.1.271, `/config` rows v2.1.269, `${user_config.KEY}`, `CLAUDE_PLUGIN_OPTION_<KEY>`, rejected in shell-form hooks and monitors, non-sensitive in `pluginConfigs` (R3 F1) | doc `plugins/manifest-reference.md:389-394`, `:436-460`; `--config <key=value>` in install help | Confirmed. Cost R3 does not state: "If you declare `options` on any field, users on Claude Code versions before v2.1.271 can't load the plugin" (`:436`). R3's `default_mode` (`run`\|`dry-run`) would use `options`, which raises the plugin's version floor to 2.1.271. |
| P32 | Plugin agent frontmatter: supported and ignored fields (R3 F1) | doc `plugins/components.md:738-739` | Confirmed; doc also lists `experimental.cacheTtl`. |
| P33 | Monitors: `experimental.monitors`, interactive only, `on-skill-invoke:<skill>` (R3 F1) | doc `plugins/components.md:989-993`, `plugins/manifest-reference.md:152`, `:325` | Confirmed. |
| P34 | Skill listing cap 1,536 chars; compaction re-attach 5,000 tokens (R3 F1, F4) | doc `skills.md:355-356`, `:539` | Confirmed. |
| P35 | `claude agents [--json] [--all] [--cwd]`, `attach`, `logs`, `stop\|kill`, `respawn [--all]`, `rm` (R3 F6) | help for each | Confirmed. `rm` also takes `--discard-unpushed` and `--force-remove-worktree`. |
| P36 | `claude daemon`: "Service install is disabled in this version — the daemon runs on demand and exits when the last client disconnects" (R3 F5) | `claude daemon --help`, verbatim | Confirmed. |
| P37 | `--bg` combined with `-p` is rejected (R3 F5) | doc `headless.md:21`, `agent-view.md:437`, `cli-reference.md:74` | Confirmed `verified-doc`. |
| P38 | `worktree.bgIsolation: "none"`; 48-hour rule; background sessions consume subscription usage (R3 F5, F6) | doc `agent-view.md:502`, `:823-824`, `:929` | Confirmed. |

## Doc-only claims

URLs are `https://code.claude.com/docs/en/<page>`; line numbers refer to the raw `.md` fetched 2026-09-29.

| # | Claim (source) | Evidence | Tag |
|---|---|---|---|
| D1 | Hook event names used by R3: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolBatch`, `MessageDisplay`, `Stop`, `StopFailure`, `Notification`, `SessionEnd`, `Setup`, `PostModelSwitch` | All are section headings in `hooks.md`. 33 events in total, which supports R3's "30+ events". | `verified-doc` |
| D2 | `SessionStart` matchers `startup\|resume\|clear\|compact\|fork`; `Setup` matchers `init`, `maintenance` | `hooks.md:308-309` | `verified-doc` |
| D3 | `StopFailure` matchers `rate_limit`, `overloaded`, `authentication_failed`; output ignored | `hooks.md:320`, `:874` | `verified-doc` |
| D4 | `Notification` matchers `quota_auto_resume_fired\|_stale\|_disabled`, `agent_needs_input`, `idle_prompt` | `hooks.md:311`, `:2256-2270`. Floors: quota types v2.1.234, agent types v2.1.198 | `verified-doc` |
| D5 | Context cap 10,000 characters per hook output; excess goes to a file with a preview | `hooks.md:923`, `:1009`. Applies to `additionalContext`, `systemMessage`, `initialUserMessage` and plain stdout, each measured separately. Preview is up to 2,000 characters. No setting raises the cap. | `verified-doc` |
| D6 | **Plain stdout reaches Claude only for `SessionStart` (and `PostModelSwitch`)** (R3 F2) | `hooks.md:792`: "The exceptions are `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, and `PostModelSwitch`" | **Corrected**, see C4. |
| D7 | `UserPromptSubmit` default timeout 30 s; 600 s default on most other events; `SessionEnd` 1.5 s (R3 F2, flagged for raw re-read) | `hooks.md:1329`, `:3340`. `SessionEnd` can be raised with a per-hook `timeout` or `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`. Agent hooks default 60 s; `MessageDisplay` 10 s; `PreModelSwitch` 30 s. | `verified-doc`. R3's three numbers are right. |
| D8 | **"`timeout` is not enforced for async hooks", applied to `asyncRewake`** (R3 F2) | `hooks.md:3681`: "Once an async hook is running in the background, Claude Code doesn't enforce `timeout` on it. Claude Code still enforces `timeout` on a hook you run with `asyncRewake`." | **Corrected**, see C2. |
| D9 | `asyncRewake` wakes Claude on exit 2 with stderr, or stdout if stderr is empty | `hooks.md:459`, `:3753` ("wakes Claude immediately even when the session is idle") | `verified-doc` |
| D10 | Handler types `command`, `http`, `mcp_tool`, `prompt`, `agent` | `hooks.md:426` | `verified-doc` |
| D11 | `CLAUDE_ENV_FILE` available to `SessionStart` hooks | `hooks.md:1208` | `verified-doc` |
| D12 | `PreToolUse` with matcher `Bash` and `if: "Bash(...)"` | `hooks.md:77-88` | `verified-doc` |
| D13 | Hook env: `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_OPTION_<KEY>` | `plugins/manifest-reference.md:523` | `verified-doc` |
| D14 | `--bare` "will become the default for `-p` in a future release" (R5 F10) | `headless.md:62`, verbatim | `verified-doc`. Nothing in the installed CLI's help announces it; in 2.1.284 it is not the default. |
| D15 | Without `--bare`, a `-p` run executes project hooks and connects `.mcp.json` servers with no trust dialog (R5 F12; R3 F2) | `headless.md:41`; help for `-p` confirms the trust dialog is skipped | `verified-doc` + `verified-local` |
| D16 | Bypass mode refused as root or under sudo, skipped inside a recognised sandbox (R5 F20) | `permission-modes.md:578-584`; message string "cannot be used with root/sudo privileges for security reasons" present in the installed binary | `verified-doc` + `verified-local` (string). Actual refusal on this host not exercised. |
| D17 | `rate_limit_event` is a documented message with `status`, `resetsAt`, `utilization`, `errorCode` (R5 F24, Q8) | `agent-sdk/typescript.md:5324-5343`. Documented fields: `status`, `resetsAt`, `utilization`, `errorCode`, `canUserPurchaseCredits`, `hasChargeableSavedPaymentMethod` | `verified-doc` |
| D18 | `rateLimitType` enum and overage fields (R5 Q8, F23) | Not in the docs page. R5 cites the SDK type file, which I did not re-read. | `unverified` by this check; R5 already marks it less stable. |
| D19 | `rate_limit_event` is emitted on the **CLI** stream (R5 F25, tagged inferred) | Not mentioned in `headless.md` (only `system/api_retry` is). String occurs 16 times in the installed binary. | stays `inferred`; not observable without a live call. |
| D20 | `system/api_retry` fields and error categories (R5 F26) | `headless.md:205-216`. Categories: `authentication_failed`, `oauth_org_not_allowed`, `account_on_hold`, `billing_error`, `rate_limit`, `overloaded`, `invalid_request`, `model_not_found`, `server_error`, `max_output_tokens`, `cloud_credential_error`, `unknown` | `verified-doc`. R5's list is a subset, marked as such ("others include"). |
| D21 | SIGTERM gives exit 143 and an unfinished turn; `CLAUDE_CODE_RESUME_INTERRUPTED_TURN=1`; send SIGINT first (R5 F17, Q4) | `headless.md:77-84` | `verified-doc` |
| D22 | Background Bash under `-p` ends about five seconds after the final result (R3 F5) | `headless.md:67` | `verified-doc` |
| D23 | Usage-limit message strings; 529 "is not your usage limit" (R5 F27, Q8) | `errors.md:43`, `:431`, `:653-654`, `:725` | `verified-doc` |
| D24 | `plugin_errors` on `system/init` for a CI load check (R3 F10) | `headless.md:236-238` | `verified-doc` |
| D25 | Stream hook events `hook_started` / `hook_progress` / `hook_response` with `--include-hook-events` (R3 F2) | `cli-reference.md:97` | `verified-doc`, with a qualification R3 omits: `SessionStart` and `Setup` hook events are always included without the flag, and `Notification`, `SessionEnd`, `PreCompact`, `PostCompact` never produce `hook_started`. |
| D26 | Stream `result` subtypes `error_max_budget_usd`, `error_max_turns`, `error_during_execution`; `permission_denied`; `result.permission_denials` (R5 Q5, Q8) | Not checked against a doc page in this pass. | `unverified` by this check |
| D27 | SDK terms sentence on claude web login (R5 F4, R3 F11) | Page fetched; sentence not re-grepped verbatim. | `unverified` by this check; two reports quote it independently. |

## Corrections that stand

**C1. `--exec` exists. R3 is wrong that it is "not in docs"; it is only hidden from `--help`.**
R3 (Q3, F5, ledger row "`claude --bg` / `claude --bg --exec`") states the flag is absent from help and from the
docs, treats it as unverified, and concludes that `--bg` "cannot run a raw Node process".

- Help: absent (`claude --help | grep -i exec` is empty). That part of R3 is right.
- Docs: present. `cli-reference.md:89`: "`--exec` | Run a shell command as a PTY-backed background job instead
  of starting a Claude session. Use with `--bg` to launch from the shell | `claude --bg --exec 'pytest -x'`".
  Also `cli-reference.md:74` and `agent-view.md:479-482`. (`verified-doc`)
- Installed binary: handles it. Strings `--exec requires a command.` and
  `warning: --exec ignores ${...} (only --name composes)`, and an argv scan for `--exec` / `--exec=`.
  (`verified-local`, existence only; not executed, since starting a job is a state change.)

What this changes: the F5 comparison table's row "What runs" and Q3's sentence must be corrected: `claude --bg
--exec '<cmd>'` can host a raw command as a supervised background job. A4's original claim was right.
What it does not change, in my reading (`inferred`): R3's verdict to keep an own detached runtime. The
remaining reasons still hold: the job lives under the Claude Code supervisor, which "runs on demand and exits
when the last client disconnects" (P36); it is Claude Code only, so it fails decision 5 and 13 portability to
dsh and the bare CLI; worktree isolation and the 48-hour rule are written for sessions and their application
to `--exec` jobs is unknown. But the option is now a real alternative for the Claude Code host and the
architecture should record it as considered and rejected with these reasons, rather than as non-existent.
The warning string also shows `--exec` ignores other flags except `--name`.

**C2. `asyncRewake` hooks are subject to `timeout`.** R3 F2 says "`timeout` is not enforced for async hooks"
in the sentence describing `asyncRewake`. The doc distinguishes the two: plain `async` hooks have no enforced
timeout; "Claude Code still enforces `timeout` on a hook you run with `asyncRewake`" (`hooks.md:3681`).
Effect on feature 113: R3's push-alert design (a long-lived `specstride watch --until-attention` started as an
`asyncRewake` hook at `SessionStart`) is killed at the timeout (600 s default for command hooks on most
events) unless the hook entry sets a large `timeout`. Whether there is an upper bound on `timeout` was not
found. The design needs either an explicit long `timeout`, a re-arming scheme, or the monitor as primary.

**C3. `claude plugin eval` has exit code 130.** R3 F10 and its matrix row list 0, 1, 2, 143. The doc table also
has "130 | Interrupted. Partial results are written" (`plugin-evals.md:413`). CI wrappers must treat 130 like
143 (not a score failure).

**C4. Plain stdout is context for four events, not two.** R3 F2 says plain stdout reaches Claude "only for
`SessionStart` (and `PostModelSwitch`)". The doc lists `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`
and `PostModelSwitch` (`hooks.md:792`). This helps R3's own design: the `UserPromptSubmit` delta line can be
plain stdout, no JSON needed. It also means any stray stdout from a `UserPromptSubmit` hook costs context.

**C5. `--safe-mode` is not absolute isolation.** R5 Q2 annotates it as "no CLAUDE.md, skills, plugins, hooks,
MCP, agents, auto memory". Help and doc both state that admin-managed policy settings still apply, and the doc
says this includes "policy-configured hooks" (`cli-reference.md:124`). Built-in plugins also keep working
(help). On a machine with managed settings the Tier 1 critic can still run a policy hook. The adapter's
`system/init` assertions (R5 Q2) are the right backstop; the doctor should report the presence of managed
settings.

**C6. `--permission-mode` choices in help are `acceptEdits, auto, bypassPermissions, manual, dontAsk, plan`.**
`default` is not listed (doc: still accepted, `manual` is the label). No value R5 uses is affected. Any
capability check that parses help must not conclude `default` is gone.

**C7. `--ablation` default is conditional, and all-excluded cases are scored.** R3 F10 says the default is
`with-without`; help says that holds only when a plugin resolves from the target, else `none`. And a case whose
graders are all in the excluded set is scored normally (`plugin-evals.md:249`), so R3's trigger suite with a
single `tool_used Skill` grader per case is scored in both arms under `with-without`, where the without-arm
must fail. R3's recommendation to gate PRs with `--ablation none` avoids the problem and should be kept as a
requirement, not a preference.

Confirmed statements worth restating because designs rest on them: R5 F8 (`--max-turns`, `--system-prompt-file`
hidden but real), R5 F9 (`--bare` is Tier 2 only), R3 P7 (`details` has no `--json`), and the `--verbose`
requirement for stream-json.

## Open questions / risks

1. **Hidden flags are a stability risk.** `--max-turns` and `--system-prompt-file` are registered with
   `hideHelp()`. They are documented, so they are supported, but the adapter's capability detection cannot
   find them by parsing `--help`. Use the `capabilities` array on `system/init` where it covers them, and a
   version floor otherwise. Owner: feature 109.
2. **Flag combination is still unproven (R5 F31, F32).** Help supports `--restricted` + `--strict-mcp-config`
   (named together in the help text) and nothing else. `--safe-mode` + `--tools ""` + `--strict-mcp-config` +
   `--no-session-persistence` + `--session-id` + `--permission-mode dontAsk` + `--permission-prompts none`
   needs one live call per role. I was not allowed to make it. This remains the single largest gap for
   feature 109.
3. **`--session-id` with `--no-session-persistence`**: both are accepted individually; whether the id given
   is echoed on `system/init` when nothing is persisted (R5's layer 2 assertion) is `unverified`.
4. **`--max-budget-usd` under subscription auth (R5 F30)** stays `inferred`. Help says "API calls".
5. **Variadic flags.** `--tools`, `--disallowedTools`, `--allowedTools`, `--add-dir`, `--mcp-config`, `--betas`
   and `--file` take `<values...>`. A positional prompt placed after one of them is swallowed. The adapter
   must send the prompt on stdin (R5 does) or end the list with another flag or `--`.
6. **`--resume` with no value opens a picker.** An empty session id in the adapter would hang a headless run
   waiting on a TTY. The adapter must refuse to build the argv when the id is empty.
7. **`--exec` behaviour is unexercised** (C1). If the architecture wants to cite it as a rejected option, one
   harmless probe (`claude --bg --exec 'true'`, then `claude rm`) would settle lifetime, worktree and
   supervisor behaviour. It changes state, so it needs the owner's permission.
8. **npm marketplace sources are not implemented** (P26). Packaging option A' needs a marketplace hosted in
   git, at a URL, or locally; only the plugin entry inside it may use the `npm` source. The direct
   `claude plugin install <package>@npm --registry <url>` form in the install help may remove the need for a
   marketplace; it is undocumented in the pages I read and is `unverified`.
9. **`userConfig.options` raises the version floor to 2.1.271** (P31); older clients cannot load the plugin at
   all. Feature 113 should either avoid `options` or state the floor.
10. **Doc versus CLI naming**: the eval doc calls the results file `results.json` in one table while the CLI
    help says `aggregate-result.json`. The CLI stands; CI should read the path from `--json <path>` or
    `--output-dir` rather than assume a name.
11. **`--bare` as future default (D14)** is confirmed in the docs with no version or date. R5's rule "state
    the mode on every call" is the right mitigation. There is no documented `--no-bare`; the Tier 1 way to
    stay non-bare after the change is unknown. `unverified`, worth a DECISIONS-PENDING watch item for the
    version pin, not a decision now.
12. **Not re-checked in this pass** (left as the reports tagged them): SDK type-file claims (R5 F23, D18),
    `result` subtypes (D26), the SDK terms sentence (D27), `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`, OTel
    environment variables, `CLAUDE_JOB_DIR`, workflow limits, scheduled-task limits, status line
    `rate_limits` fields.
