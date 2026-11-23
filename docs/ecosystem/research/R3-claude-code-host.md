# R3 — Claude Code as host

Access date for every `verified-doc` tag: 2026-09-29, pages under `https://code.claude.com/docs/en/` (path given per claim). Installed CLI: `claude --version` prints `2.1.284 (Claude Code)` (`verified-local`). Two caveats on method: (1) the docs were read through a page-fetch tool that summarises long pages, so numeric defaults quoted from the hooks page (timeouts, caps) should be re-read raw by the verifier; the plugin, eval, agent-view, headless, marketplace and loading pages were read close to verbatim. (2) No model calls were made; no paid probes.

## Prior art consulted

- `/root/specstride-claude/prompts/analysis/A4-claude-code-host-facts.md` (46 lines). Most claims confirmed; one contradicted/unverified (`claude --bg --exec`); several extended (see "A4 verification ledger").
- `/root/specstride-claude/prompts/specstride-ecosystem.md`: §0, §1, §2 decisions 5, 13, 14, 15, 16, 18, 19 (and 8, 12, 17, 21 where they touch hooks), row R3 (line 333), neighbours R14/R17 (lines 345-346), R3v (line 378).
- Installed CLI: `claude --help`, `claude plugin --help`, `claude plugin eval --help`, `claude plugin details <installed plugin>`, `claude plugin validate|install|init|tag --help`, `claude agents|attach|logs|stop|respawn|rm|daemon --help`, `npm view` on the two Anthropic packages (read-only registry metadata).
- Not read: qmd fleet notes (this report is about public Claude Code behaviour). Not used: any credential or state file.

## Questions answered

**Q1. What does each plugin feature give Specstride?** See the feature table in Findings F1. Short form: skills (yes, the two front doors), hooks (yes, the status/alert/guard channel), `bin/` (yes, one thin shim), `userConfig` (yes, small), agents (yes, one cheap supervisor agent), monitors (optional, interactive only), MCP (no), workflows (not Wave 1), output styles / plugin settings (no), scheduled tasks (no), background sessions (optional user-level way to keep the host itself alive; not the runtime).

**Q2. Which hook events carry budget/quota alerts, run status, re-attachment, pre-launch guardrails, and at what context cost?** F2. Summary: `SessionStart` (re-attach, ~50-100 tokens when a run exists, zero otherwise), `UserPromptSubmit` (delta status line, dedup'd), `PreToolUse` on Bash (guardrail, zero unless it fires), `StopFailure` matcher `rate_limit` and `Notification` `quota_auto_resume_*` (quota facts, no context injection, so they write events for the next injection), `asyncRewake` command hook (push alert when blocked/finished, cost only when it fires). Avoid `Stop`/`PostToolUse` context injection: it re-enters the loop on every turn.

**Q3. Detached Node runtime vs `claude --bg`?** F5-F6. They are not substitutes. `--bg` hosts an LLM session under a supervisor (uses quota, one model conversation, can be re-attached); it cannot run a raw Node process (the `--exec` form in A4 is not in `--help`). Our runtime must be our own detached process with PID + state files. `--bg` is useful as an optional way to keep the host orchestrator alive, with caveats (worktree isolation, no usage-limit auto-wait).

**Q4. Where may state be written?** F7. Run state: the project (`.specstride/`), because the CLI must work with no host. Host-only scratch and dependency installs: `${CLAUDE_PLUGIN_DATA}`. Never `${CLAUDE_PLUGIN_ROOT}`. Bash-tool commands see neither variable, so a `SessionStart` hook writes them to `CLAUDE_ENV_FILE`, or skill text substitutes them inline.

**Q5. Packaging for npm consumers (decision 19)?** F8-F9, Options table. Recommendation: one published npm package that contains the CLI and the plugin directory; the plugin is a thin layer whose `bin/specstride` shim resolves the global CLI (falling back to a version-pinned `npx`), with a protocol handshake. Native code, if the owner approves any, ships as per-platform `optionalDependencies` prebuilts, never as install-time compilation.

**Q6. `claude plugin eval`?** F10. Suites, six grader types, cost formula, CI recipe with exit codes, and the decision-15 suite shape.

## Findings

### F1. Plugin feature x Specstride use

| Feature | Facts (tag) | Specstride use, or why not |
|---|---|---|
| Manifest | `.claude-plugin/plugin.json`, only `name` required; unknown top-level keys stripped, unknown keys inside `userConfig`/`channels`/`lspServers`/`monitors` entries are errors (`verified-doc` plugins/manifest-reference) | Ship one, with pinned `version` (an npm-source plugin otherwise gets version `unknown`, `verified-doc` plugins/loading "How Claude Code computes the version"). Run `claude plugin validate --strict` in CI (`verified-local`: `claude plugin validate --help` lists `--strict`, `--json`). |
| Skills | `skills/<name>/SKILL.md`; plugin skills namespaced `/plugin:skill`; only name+description resident, combined `description`+`when_to_use` cut at 1,536 chars; body enters as one message and persists; after compaction the most recent invocation of each skill is re-attached keeping the first 5,000 tokens, all re-attached skills sharing 25,000 (`verified-doc` skills) | `specstride-run`, `specstride-reverse`, `doctor`. Keep `SKILL.md` far below 5,000 tokens so compaction never truncates it (feeds decision 16 budget). `disable-model-invocation` must stay false for both (evals test auto-trigger); `doctor` may set it true. `allowed-tools: Bash(${CLAUDE_SKILL_DIR}/../../bin/specstride *)`-style rules pre-approve the CLI for the invoking turn (`verified-doc`: `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` substitute in skill body and `allowed-tools`). `!`-command injection can pre-run `specstride status --terse` so the model never spends a turn asking. |
| Hooks | `hooks/hooks.json` plus manifest `hooks`; registered at plugin load, fire on their events regardless of skill use (`verified-doc` plugins/components "When plugin hooks fire"); harness-only hooks have "no model context cost" (`verified-local`: `claude plugin details autoharness` prints `Hooks (4) ... (harness-only — no model context cost)`) | Status, alerts, re-attach, guard. See F2. |
| Monitors | Under `experimental.monitors` (`verified-doc`); shell command run for the session, stdout lines become notifications; interactive sessions only, never `-p`, not on Bedrock/Vertex/Foundry, not loaded from project-scope skills-dir plugins; no `${user_config.*}` and no `CLAUDE_PLUGIN_OPTION_*`; `when: "on-skill-invoke:<skill>"`; not stopped if plugin disabled mid-session; a plugin update needs a session restart (`verified-doc` plugins/components, loading) | Optional live tail: `specstride watch --lines` started `on-skill-invoke:specstride-run`, emitting one line per state change (phase done, blocked, quota pause, finished). Every emitted line costs context, so the CLI dedups and rate-limits. Not the primary channel (interactive only; hooks also work under `-p`). |
| Workflows | `workflows/*.js`, run as `/plugin:name`; script coordinates many subagents, cannot touch filesystem itself; 16 concurrent agents default; 1,000 agents/run; does not auto-wait on usage limit in `-p`, background sessions (`verified-doc` workflows) | Not Wave 1: our gated loop is a deterministic runtime, and a workflow would spend model tokens on orchestration. Candidate later for parallel derivation/validation fan-out across features. Not needed for supervision. |
| Agents | `agents/*.md`, namespaced `plugin:agent`; supported frontmatter: `name, description, model, effort, maxTurns, tools, disallowedTools, skills, memory, background, omitClaudeMd, isolation, color`; **ignored** in plugin agents: `permissionMode, hooks, mcpServers, initialPrompt` (`verified-doc` plugins/components) | One `specstride-supervisor` agent: small model, `tools: Bash` narrowed by the skill's `allowed-tools`, `background: true`, `omitClaudeMd: true`. It polls `specstride status` and returns one line, so supervision cycles stay out of the main context (R17 sets the budget). Cannot carry its own hooks; put any hook at plugin level. |
| `bin/` | Files in `bin/` are on the Bash tool's PATH while the plugin is enabled, appended after the user's PATH (cannot shadow `git`); plugin with `bin/` is not installed by claude's web app/Cowork (`verified-doc` plugins/components "Executables") | One shim `bin/specstride` (Node script, `#!/usr/bin/env node`) that locates the real CLI. It is on the PATH of Bash-tool commands, but is **not** on the PATH of hook processes by that mechanism (unverified; hooks reference `"${CLAUDE_PLUGIN_ROOT}/bin/specstride"` explicitly, which is documented). Effect: claude's web app web/Cowork is out of scope, matching decision 13 (Claude Code CLI first). |
| `userConfig` | Types `string, number, boolean, directory, file`; `sensitive` goes to the platform credential store; `options`, `multiple`, `min/max`, `default`, `required`; non-sensitive values in `pluginConfigs` in user settings, and shown in `/config` (v2.1.269+); `options` needs v2.1.271+; referenced as `${user_config.KEY}` in MCP/LSP config, exec-form hook `args`, skill/agent content (sensitive values become a placeholder there), and as `CLAUDE_PLUGIN_OPTION_<KEY>` in hook processes; rejected in shell-form hooks and monitor commands (`verified-doc` plugins/manifest-reference) | Only host-facing knobs: `micro_loops` (boolean), `default_mode` (`run`|`dry-run`), `terse_alerts` (boolean). No secrets: decision 6 says secrets are `env:`/`file:`/keychain references in Specstride config, so do not duplicate them as `sensitive` userConfig. Precedence (decision 9) is unaffected because `specstride.yaml` and the flags still win; hooks read the option env var and pass it as a flag. `claude plugin install --config key=value` (`verified-local`, install --help) allows scripted setup. |
| Background sessions | `claude --bg "<prompt>"`, supervisor, `claude agents --json`, `attach|logs|stop|respawn|rm` (`verified-doc` agent-view; `verified-local` help) | See F5-F6. Optional: user dispatches `/specstride:specstride-run` in a `--bg` session; not our runtime. |
| Scheduled tasks | `/loop`, `CronCreate|List|Delete` are session-scoped, recurring tasks expire after 7 days, restored on `--resume`, minimum 1 minute; durable options are cloud Routines and Desktop tasks (`verified-doc` scheduled-tasks) | Not used for the run. A self-paced `/loop` is one way the *model* can supervise cheaply inside a session; the skill may suggest it, but restart-survival comes from our state files, not from cron. |
| MCP | `.mcp.json`; stdio servers get `CLAUDE_PLUGIN_ROOT/DATA`; plugin tools are named `mcp__plugin_<plugin>_<server>__<tool>` (`verified-doc`) | No. Decision 16 and R17 prefer plain CLI calls (no resident schemas). Revisit only if a host needs a push channel: `channels` (MCP-bound message channels) exist in the manifest (`verified-doc`), but their maturity is unverified. |
| Output styles | `output-styles/` Markdown (`verified-doc`) | No: changes the whole session's persona; the terse digest is the CLI's job (decision 16). |
| Plugin settings | `settings.json`/manifest `settings`: only `agent` and `subagentStatusLine` take effect; a user's own value overrides (`verified-doc`) | No `agent` (would take over the main thread). `subagentStatusLine` could label the supervisor agent's row; defer to R13. The main status line cannot be shipped by a plugin (`verified-doc`; confirms A4). |
| LSP, themes | Present | Not applicable. |
| Dependencies | `dependencies` field: other plugins that must be enabled (`verified-doc`) | Future: dsh/other-host plugins do not depend on each other; not used. |

### F2. Hooks in depth (mechanics only; R14 owns alert semantics)

Sources: `verified-doc` hooks (event table, size caps, async, env), plugins/components (plugin hooks). The event table was read through a summariser; the event names and handler types match what `claude --include-hook-events` implies in `--help` (`verified-local`: "Include all hook lifecycle events in the output stream", stream-json only), but numeric timeouts are `unverified` until re-read raw.

Facts that govern every hook:
- Handler types: `command`, `http`, `mcp_tool`, `prompt`, `agent`. Command hooks can be exec-form (`args`, no shell, safe with `${user_config.*}`) or shell-form.
- Context injection: `additionalContext` is capped at 10,000 characters per hook output; excess is written to a file and a path plus preview is sent instead. Plain stdout reaches Claude as context only for `SessionStart` (and `PostModelSwitch`); for other events it goes to the debug log.
- `SessionStart` fires on new session, `--resume`/`--continue`, `/clear`, compaction and fork (matcher: `startup|resume|clear|compact|fork`) and exposes `CLAUDE_ENV_FILE`. A hook that exits 0 with no output costs no tokens.
- Env in hook processes: `CLAUDE_PROJECT_DIR`, `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `CLAUDE_PLUGIN_OPTION_<KEY>`.
- `async: true` runs in the background without blocking; `asyncRewake: true` runs in the background and, on exit code 2, wakes Claude with the stderr/stdout as a system reminder (`timeout` is not enforced for async hooks).
- Under `claude -p` the trust dialog is skipped, and project hooks run unless `--bare` (`verified-doc` headless; `verified-local`: `--bare` help says it skips hooks including those of installed plugins). So the plugin's hooks do not run for a proposer/critic `claude -p --bare` child, which is what we want (R5's adapter should use `--bare`, needing an API key; see R5).

| Need | Event and matcher | What the hook does | Context cost | Notes / limits |
|---|---|---|---|---|
| Re-attach on session start | `SessionStart` (all sources, especially `resume`, `startup`, `compact`) | `specstride status --terse --since-last-seen`. If a run exists in `$CLAUDE_PROJECT_DIR/.specstride`, print 1-3 lines: run id, state (running/paused-quota/blocked/finished/dead), phase n/N, last digest line if finished. Exit 0 with no output when no run. | 0 tokens with no run; about 40-100 tokens with a run (inferred: three short lines). Re-fires after `compact`, so print only when state changed since the last injection (dedup marker in `${CLAUDE_PLUGIN_DATA}`). | Runs in background, does not block input. Also exports `SPECSTRIDE_HOST=claude-code` via `CLAUDE_ENV_FILE`. |
| Run-status update mid-session | `UserPromptSubmit` (no matcher) | Same command in delta mode: prints nothing unless the run's state or phase changed since the last injection. | 0 unless changed; then one line (~25 tokens). | Default timeout reported as 30 s (`unverified` numeric). Fires on every prompt so the command must be fast (read one small file, no network). |
| Run-status push (no user prompt needed) | `asyncRewake` command hook started at `SessionStart`, or a plugin monitor | Long-lived `specstride watch --until-attention` exits 2 with one line when the run becomes `blocked`, `paused-quota`, `finished`, or `dead`. | Cost only when it fires (one short reminder). | Whether the async hook survives for the whole session, and whether it re-arms after firing, is `unverified` (docs say it "wakes Claude on exit 2"; no lifetime stated). Monitor is the documented persistent alternative but interactive-only. Prefer hook first, monitor second, and test both. |
| Budget/quota alert facts | `StopFailure` matcher `rate_limit` / `overloaded` / `authentication_failed` (reports the *host's* turn API errors) and `Notification` matchers `quota_auto_resume_fired|_stale|_disabled` (`verified-doc` hooks, summarised) | Append an event line (host-observed) to the run's events file; never inject context (these events cannot). | 0 | These describe the *host* session's own quota, not the detached proposer's. The proposer's quota signal comes from the adapter (R5/R14). The host signal is still valuable under Tier 1, where host and proposer share one subscription (inferred). |
| Subscription usage observation | Status line `rate_limits.five_hour.used_percentage`, `seven_day...`, `resets_at` (`verified-doc` statusline; Pro/Max only, after first API response) | A plugin cannot ship the main status line. The user's own status line script may write the numbers to a file; a `UserPromptSubmit` hook then reads them. Hook stdin fields for rate limits are `unverified`. | 0 | Optional doctor step: offer a status-line snippet. Hand to R14 as an *observation source*, not a dependency. |
| Pre-launch guardrail | `PreToolUse`, matcher `Bash`, with `if: "Bash(specstride run *)"` (permission-rule syntax, `verified-doc`) | Calls `specstride preflight` (terms gate, budget present, lock free, critic pick announced). Return `permissionDecision: "deny"` with a one-line reason, or `allow`/nothing. | 0 unless it denies (then the reason line). | Defence in depth only: the CLI itself refuses the same checks (a hook is skippable with `--bare`, other hosts have none). Decision 18: guardrail cannot be overridden by the comment. `updatedInput` exists but do not rewrite commands. |
| Block-on-human visibility | `Notification` matcher `agent_needs_input` / `idle_prompt` (host's own idle state) | Optional desktop notification sequence (`terminalSequence`). | 0 | Cosmetic; keep off by default. |
| Session end bookkeeping | `SessionEnd` | Write "last seen offset" only; must finish within a 1.5 s shared budget (`unverified` numeric). | 0 | Do not start or stop the runtime here. |
| Launch-time environment | `Setup` (`claude --init-only`, `-p --init`, `-p --maintenance`) | Optional pre-warm of `${CLAUDE_PLUGIN_DATA}` dependencies in CI/containers. | 0 | Not needed when the CLI is global (F8). |

Events to avoid for status: `Stop` and `PostToolUse` context injection (fires every turn; `Stop` with a block decision keeps the conversation going and burns tokens), `PostToolBatch`, `MessageDisplay`. They are harmful under decision 16.

Stream visibility: with `claude -p --output-format stream-json --include-hook-events` the host's own hooks appear as `hook_started/hook_progress/hook_response` events (`verified-doc` headless, `verified-local` help), which lets the eval and doctor tests assert that the `SessionStart` hook printed what we expect.

### F3. Plugin layout and marketplace (`verified-doc` manifest-reference, marketplace-reference)

- Standard layout: `.claude-plugin/plugin.json`, `skills/`, `commands/`, `agents/`, `hooks/hooks.json`, `.mcp.json`, `.lsp.json`, `output-styles/`, `workflows/`, `themes/`, `monitors/monitors.json`, `bin/`, `settings.json`. A `CLAUDE.md` in the plugin is not loaded.
- Marketplace: `.claude-plugin/marketplace.json`; plugin `source` types: relative path, `github`, `url`, `git-subdir`, `npm`, `archive` (sha256-pinnable), `command`. Reserved marketplace names include `npm`, `github`, `inline`, etc.
- Marketplace-installed plugins are **copied** into `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`; files outside the plugin directory are not copied; `${CLAUDE_PLUGIN_ROOT}` changes with every version and old versions are removed 14 days after update (`verified-doc` plugins/loading). `--plugin-dir` and local-directory marketplaces load in place.
- Session-only loading: `--plugin-dir <dir|zip>`, `--plugin-url` (`verified-local` help). `claude plugin init <name>` scaffolds `~/.claude/skills/<name>/` (`verified-local`). `claude plugin tag` creates `{name}--v{version}` tags after checking `plugin.json` against the marketplace entry (`verified-local`).
- Install from shell: `claude plugin install <plugin>@<marketplace> [--config k=v] [-s user|project|local] [--json] [-y]` (`verified-local`). `claude plugin marketplace add|list|remove|update` (`verified-local`).
- Installed here: two disabled third-party plugins (`claude plugin list`), so `claude plugin details <name>` was exercised on those only. Its output has an "Always-on: ~N tok" and a per-component on-invoke column (`verified-local`). It has no `--json` flag (`verified-local`: `claude plugin details --help` lists only `-h`), so a CI budget check must parse text or read the same numbers via our own counter (R17).

### F4. Context cost model (feeds decision 16; R17 owns the budgets)

- Resident cost of the plugin per session: skill listing (name + description, capped 1,536 chars each), agent descriptions, hook = 0 (harness-only), `bin/` = 0, monitors = per emitted line. `claude plugin details specstride` gives the projected always-on figure (`verified-local`, mechanism shown on other plugins: 86 and 138 tokens always-on for plugins with 3 skills / 1 skill + 2 agents).
- On-invoke cost: `SKILL.md` body (persistent for the rest of the conversation, re-attached after compaction up to 5,000 tokens) plus any `!`-injected output. Keep detail in files loaded on demand.
- A SessionStart hook's stdout is the only "free" way to inject state without a tool call, but it is persistent context: keep it to a few lines.

### F5. Detached runtime that outlives the session

Facts:
- No plugin API starts a process that outlives the session and gives it back to a later session (`verified-doc` plugins/components has hooks, monitors, MCP servers, LSP servers, none documented as detachable; `inferred` from absence). Decision 5 stands.
- Bash-tool background tasks (`run_in_background`) survive turns but not the session; under `claude -p` they end about five seconds after the final result; on SIGTERM Claude Code "terminates the process tree of any Bash command that is still running" (`verified-doc` tools-reference "Background commands", headless "Background tasks at exit", "Stop a run with SIGTERM").
- Plugin monitors stop with the session (`verified-doc`). MCP server processes are owned by the session (`inferred`).
- So the runtime must escape the process tree: spawn from the CLI with `child_process.spawn(process.execPath, [runtimeEntry], { detached: true, stdio: ['ignore', logFd, logFd] }).unref()` (a new session and process group via `setsid`). Whether Claude Code's OS sandbox for Bash (bubblewrap on Linux, Seatbelt on macOS) permits detached survivors is `unverified` (the eval docs say the sandbox confines writes and network for granted Bash under evals; ordinary interactive Bash sandboxing is opt-in, not tested here). Needs a Wave 1 spike (see risks).

Design comparison (our PID/state-file design vs `claude --bg`):

| Criterion | Own detached Node runtime | `claude --bg` session |
|---|---|---|
| What runs | Deterministic TS loop; proposer/critic subprocesses | A Claude conversation (model turns), under a supervisor (`verified-doc` agent-view) |
| Cost when idle/waiting | Zero model tokens; a 73 %-of-run-time verification wait (A5) costs nothing | Waiting is a model turn or a Monitor; uses subscription quota (docs: "consume your subscription usage the same as interactive sessions") |
| Survives terminal close | Yes if started with `setsid`/detached (own design, spike needed) | Yes: "Background sessions don't need any terminal open" (`verified-doc`) |
| Survives host crash/reboot | We decide: relaunch policy (aim 3), PID + start-time check, resume from counts (decision 23) | Reboot: session shows failed for 48 h then restarts from where it left off on attach/reply; after 48 h shows `stopped` (`verified-doc`); model context, not our loop state |
| Supervisor lifetime | Our own; systemd/launchd optional later | `claude daemon`: "Service install is disabled in this version — the daemon runs on demand and exits when the last client disconnects" (`verified-local`, `claude daemon --help`). So no OS-level service (`inferred`: reboot persistence is limited to the 48 h rule above) |
| Re-attach | `specstride status/attach`: read state file, verify PID alive and start-time matches, tail events | `claude attach <id>`, `logs <id>`, `agents --json` (states working/blocked/done/failed/stopped) (`verified-doc`) |
| Programmatic status | Our event schema (decision 11) | `claude agents --json` with `id, state, pid, sessionId, cwd` (`verified-doc`); `state.json` under `~/.claude/jobs/<id>/` but docs say use `--json` rather than reading files |
| Host portability | Same runtime under dsh and CLI (decision 5, 13) | Claude Code only |
| Isolation side effects | None | Every bg session moves into a git worktree before editing unless `worktree.bgIsolation: "none"` (`verified-doc`), which would break a run that expects the project tree |
| Usage-limit handling | Ours (decision 8: pause, resume at reset) | Agent-view limits list: no usage-limit auto-wait for workflows in background sessions (`verified-doc` workflows "When a run hits your usage limit") |
| Permissions | None needed for Node | Permission mode of the session applies; `--dangerously-skip-permissions` needed for unattended (`verified-doc`) |
| `--bg` with `-p` | n/a | Rejected: "Claude Code rejects `--bg` combined with `-p`" (`verified-doc` agent-view, headless) |

Verdict: keep our own design. `claude --bg` is for the host conversation (a user who wants `specstride-run` to be dispatched and supervised without keeping a terminal open); the skill can mention it, and the doctor should warn about `worktree.bgIsolation`. A4's `claude --bg --exec '<cmd>'` is not in `claude --help` (`verified-local`: `claude --help | grep -i exec` returns nothing) and the docs show only a positional prompt; treat as unverified and do not design on it.

Reattach protocol (mechanics for feature 113; content owned by architecture): `${project}/.specstride/run/<run-id>/{runtime.pid, runtime.json (pid, startedAt, argv0 hash, boot id), state.json, events.ndjson, lock}`; a `SessionStart`/CLI `status` verifies liveness by `pid` + process start time (guards PID reuse) and reports `dead` if the state says running but the process is gone, which triggers the relaunch policy. All host output is derived from these files (Principle I).

### F6. `claude --bg` as an optional host session (facts for the doctor and skill)

- Starts a session that "returns immediately", prints an id; `claude agents [--json] [--all] [--cwd]`, `attach`, `logs`, `stop|kill`, `respawn [--all]`, `rm` (`verified-local` help).
- `CLAUDE_JOB_DIR` = `~/.claude/jobs/<id>`; `$CLAUDE_JOB_DIR/tmp` is scratch without permission prompts (`verified-doc`). Not usable for run state (removed by `rm`, per-session).
- Rate limits apply; N background sessions use quota N times as fast (`verified-doc`).
- On macOS the background host needs Files & Folders access for `~/Desktop` etc. (`verified-doc`), relevant to consumers who keep repos there.

### F7. State locations and what Bash-tool commands can see

- `${CLAUDE_PLUGIN_DATA}` = `~/.claude/plugins/data/<id>/` (id = plugin id with characters other than letter/digit/`_`/`-` replaced by `-`); created on first reference; survives updates; deleted when the plugin is uninstalled from its last scope unless `--keep-data` (`verified-doc` manifest-reference, loading). `CLAUDE_CODE_PLUGIN_CACHE_DIR` relocates the plugins root (`verified-doc`).
- Exported to hook processes, MCP stdio servers, LSP servers; **not** exported to monitors, and **not present** in the environment of commands Claude runs through the Bash tool, in the main session or a subagent (`verified-doc` manifest-reference "Where each variable resolves"). `${...}` in skill/command/agent Markdown is substituted inline instead.
- Consequences and design:
  - The CLI must not rely on `CLAUDE_PLUGIN_DATA`. Anything the CLI needs (project dir is the cwd; host name) it gets from flags, `specstride.yaml`, or env set by a `SessionStart` hook writing to `CLAUDE_ENV_FILE` (`verified-doc`: env vars persist across later Bash commands that way).
  - Run state, events, locks, contract: project-local `.specstride/` (decision 3: greenfield layout is ours). Rationale: the run belongs to a repo; the CLI, dsh and the kanban read the same files; uninstalling the plugin must not delete a run (plugin data is deleted on uninstall).
  - `${CLAUDE_PLUGIN_DATA}`: only host-scoped derived state (last-injected-status marker, doctor cache) and, if ever needed, `node_modules`.
  - Never write into `${CLAUDE_PLUGIN_ROOT}`: it is a versioned cache copy (`verified-doc`).
  - Bash-tool commands run in the session cwd; environment variables do not persist between commands without `CLAUDE_ENV_FILE` (`verified-doc` tools-reference "What persists between commands").
  - Subagents and workflows inherit no special variables (`verified-doc`).

### F8. Native dependencies and npm delivery mechanics

- Claude Code's own delivery is instructive: `npm view @anthropic-ai/claude-code` (`verified-local`, 2.1.284) shows `bin: claude -> bin/claude.exe` plus `optionalDependencies` for eight platform packages (`-linux-x64`, `-linux-arm64`, `-darwin-x64`, `-darwin-arm64`, `-linux-x64-musl`, `-linux-arm64-musl`, `-win32-x64`, `-win32-arm64`); `@anthropic-ai/claude-agent-sdk` (0.3.284) uses the same pattern. This is the proven "prebuilt binary per platform via optionalDependencies" model and works with `--ignore-scripts`.
- Plugin cache install of dependencies: when a marketplace-installed plugin has `package.json` **and** an npm lockfile, Claude Code runs `npm ci --ignore-scripts` (or `bun install --frozen-lockfile --ignore-scripts`) in the cached copy, 60 s timeout; Yarn/pnpm lockfiles are skipped; no lifecycle scripts, so **dependencies that compile native modules in `install`/`postinstall` are not built**; the install cannot be disabled; failure never blocks the plugin, it only logs in `--debug` (`verified-doc` plugins/loading "Node.js package dependencies"). For an npm-source plugin use `npm-shrinkwrap.json` since npm strips `package-lock.json` when publishing.
- `npm` plugin source: `{source:"npm", package, version, registry}` fetched with the user's npm client, unpacked without running install scripts (`verified-doc` marketplace-reference). Version resolves to `unknown` unless the manifest sets `version` (`verified-doc` loading).
- Bundling to one file: an esbuild/tsup bundle can inline all pure-JS dependencies, but cannot inline `.node` addons or a platform binary. Therefore a single bundled file is viable only while the plugin has no native component.
- Native module candidates named in the prompt: keychain (decision 12, Linux and macOS). A binding like `keytar` needs compilation or prebuilds and adds libsecret to Linux; prefer shelling out to `security` (macOS) and `secret-tool` (Linux) or reading `env:`/`file:` refs (`inferred`; design belongs to R8/R16). Avoid `node-gyp`-based addons in the plugin/CLI path entirely; any Language Ledger native component (decision 2) ships as per-platform optional-dependency prebuilts for `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64` (plus musl if Alpine matters), with a pure-TS fallback where feasible and a doctor check.
- Node engine: the machine has Node 22.23.2 and npm 10.9.8 (`verified-local`). Set `engines.node` to a floor the owner accepts (recommendation: `>=20`, matching current LTS lines; the prompt notes Node 22 on this machine).

### F9. Packaging options (decision 19)

| Criterion | A. Global npm CLI + thin plugin(s) | B. Plugin bundles one built file from the same package | C. Install on first run (SessionStart hook installs into `CLAUDE_PLUGIN_DATA`) |
|---|---|---|---|
| Install steps for a consumer | `npm i -g specstride`, then `claude plugin marketplace add ...` + `claude plugin install specstride@...` (or plugin via npm source) | One plugin install, no npm step | One plugin install, network at first session |
| Works with CLI/dsh/other hosts | Yes, the CLI is the product; plugins are shims | Plugin-only copy; other hosts need their own install | Same as B |
| Version skew | Possible: plugin `X` with CLI `Y`; mitigated by a `specstride --protocol` handshake and a compatible range in the shim | None inside one host; skew appears between hosts using the same repo state | None inside, but update races on `CLAUDE_PLUGIN_ROOT` change |
| Native deps | Fine: `npm i -g` runs normal install, optionalDependencies prebuilts resolve per platform | Not possible in one file; `--ignore-scripts` prevents compile; only pure JS | Runs `npm install` from a hook, scripts allowed (your command), but slow (up to 600 s hook limit, `unverified` numeric), needs network, node/npm on PATH, fails offline, races with parallel sessions |
| Detached runtime start | CLI spawns `node <pkg>/dist/runtime.js` | Shim must spawn `node "${CLAUDE_PLUGIN_ROOT}/dist/runtime.js"`; that path changes on plugin update while a run is live, so the runtime must copy or pin its own entry (extra design) | Runtime path in `CLAUDE_PLUGIN_DATA` (stable) but install state can be half-complete |
| Runtime path stability across plugin update | Global install path stable until `npm i -g` | Version dir removed 14 days later; a long run could lose its files (`verified-doc` cleanup) unless copied | Stable |
| Evolvability (new host) | Best: host plugins never contain logic | Worse: logic duplicated per host bundle | Worse |
| Offline / air-gapped | Works after one npm install | Works | Fails |
| Discoverability | Two-step | One-step | One-step |
| Cost of failure | Clear doctor error "CLI not found, run npm i -g" | Silent staleness | Silent partial install (debug log only) |

Variant A': publish **one npm package** that contains both the CLI and the plugin directory (`.claude-plugin/`, `skills/`, `hooks/`, `bin/` shim). A marketplace entry with `source: {source: "npm", package: "specstride", version: "^x"}` (`verified-doc`) makes the plugin lockstep with the CLI version, and the shim then uses the sibling package it was published with when it is also globally installed, else falls back to the global. Caution: `verified-doc` says the npm-source plugin is fetched *without* dependencies unless a shrinkwrap is present; the plugin content is only shims, so no dependencies are needed at that layer.

### F10. `claude plugin eval` (decision 15)

Facts (`verified-doc` plugin-evals, `verified-local` `claude plugin eval --help`):
- Needs v2.1.269+ (installed 2.1.284), git 2.31+ if git is present (checked since v2.1.283).
- Suite: `evals/<case>/prompt.md` (frontmatter: `model`, `max_turns` default 10, `timeout_seconds` default 300, `tags`, `allowed_tools`, `runs`) plus `graders/*.md`; optional `case.yaml` (`schema_version: "1.1"`); `evals/mocks/<server>/<tool>.md` for MCP; `context.scaffold_script` (runs author bash, only with `--scaffold`).
- Runs: each run is a fresh isolated `claude -p` child with a temp HOME, only the plugin loaded, no user settings/hooks/CLAUDE.md/other plugins; default 3 runs per case per arm; second arm is a no-plugin baseline (`--ablation with-without` default). The Artifact tool is off.
- Tools: read-only tools listed in `allowed_tools`; `Bash/Write/Edit/WebFetch/WebSearch` removed unless granted with `--allow-tools`; granting Bash needs an OS sandbox backend (bubblewrap + socat on Linux; native Windows unsupported) or the run is refused.
- Graders (six): `regex`, `tool_used`, `tool_order`, `file_exists` (free, transcript-derived), `llm`, `baseline` (judge model, default haiku, three judge calls per grader per run). `tool_used` with `tool: Skill` and `input_match` regex tests triggering, also for the namespaced form; such graders are `scored:false` in a two-arm run unless `arm: both` (used for "must not invoke" with `min: 0, max: 0`).
- Output: `evals/results/<ts>/aggregate-result.json` (`schemaVersion: 1`, `costUsd`, `claudeVersion`, `partial`), `report.html` (self-contained), `--json [path]`.
- CI flags: `--trust-plugin` (mandatory when `CI` is set or not a TTY, else exit 1), `--model`, `--judge-model`, `--threshold` (default 1.0, cases below make exit 1), `--max-cost-usd`, `-j 1..8` (share one rate limit), `--runs`, `--case`, `--tag`, `--ablation none`. Exit codes: 0 pass; 1 below threshold / case failed to load / no cases / not trusted / bad option; 2 partial (cost ceiling hit or credential rejected); 143 terminated. Credentials come from the environment, for example `ANTHROPIC_API_KEY`. `claude plugin eval init --bare <name>` scaffolds a blank case in CI.
- Failure mode to plan for: a usage-limit error mid-suite ends later runs with score 0 without marking the suite `partial`, so results can look like a regression (`verified-doc` troubleshooting).

Cost model (`inferred` from "roughly cases x runs agent runs with the plugin and the same number again for the baseline, plus three short judge calls per llm/baseline grader per run"): agent runs = cases x runs x arms. For a first suite of 16 cases (8 positive and 8 negative across the two skills) x 3 runs x 1 arm (`--ablation none`) = 48 short runs. With only free graders the model cost is 48 runs of `max_turns: 3`-ish skill-selection turns; no dollar figure is quoted because none was measured (no paid probes). Use `--max-cost-usd` and the reported `costUsd` after the first run.

Recommended suite shape for `specstride-run` / `specstride-reverse`:
- Trigger suite (free graders, run on every PR): per skill about 6-8 positive prompts phrased as users would type them (not naming the skill; include a mode/comment variant such as "only the first two features" for `specstride-run`, and "reverse-engineer this codebase into a spec" for reverse), and about 6-8 negatives (unrelated coding tasks, plain Spec Kit authoring requests, "explain this test", and the confusable pair: run vs reverse). Graders: positive = `tool_used Skill` on the right skill (indicator only in a two-arm run); negative = `tool_used Skill` with `min: 0, max: 0` and `arm: both`; cross-skill negatives assert the *other* skill is absent. Restrict `allowed_tools: [Skill, Read, Glob, Grep]` so runs cannot execute; a triggered skill body loads but no launch happens (no Bash), which also makes the tests safe.
- Behaviour smoke (nightly, needs granted Bash and a stub CLI on PATH via `scaffold_script`): assert `tool_order` (`specstride doctor` before `specstride run`), and that a `dry-run` request never calls `run`. Stub the CLI with a shell script created by `--scaffold`; suites are then run only on trusted code.
- Ablation `Δ`: run `--ablation with-without` occasionally (weekly) to confirm the plugin adds value; do not gate on it (delta never changes the exit code).
- Pin `--model` and `--judge-model` so a model rollout is not read as a regression; use `--threshold 0.8` or higher with `--runs 3`; store `aggregate-result.json`.
- Also a zero-cost structural gate: `claude plugin validate . --strict` and a `claude -p --output-format stream-json` load check reading `system/init.plugins` and `plugin_errors` (`verified-doc` headless "Fail CI when a plugin or MCP server doesn't load").
- The `evals/` directory lives inside the plugin directory, so exclude it from the published npm `files` (or point `experimental.evals` at a directory outside the shipped set) to avoid shipping it to consumers (`inferred`).

### F11. Facts other reports should know (defers)

- `claude -p` proposer/critic flags: R5 owns. Confirmed present in `--help` (`verified-local`): `--output-format text|json|stream-json`, `--input-format`, `--json-schema`, `--tools`, `--allowedTools`, `--disallowedTools`, `--max-budget-usd`, `--fallback-model`, `--model`, `--effort`, `--no-session-persistence`, `--session-id`, `--setting-sources`, `--strict-mcp-config`, `--permission-mode`, `--permission-prompts host|none`, `--bare`, `--safe-mode`, `--restricted`, `--settings`, `--append-system-prompt`, `--system-prompt-snapshot`, `--include-hook-events`, `--forward-subagent-text`. `--bare` never reads OAuth/keychain, so a Tier-1 subscription proposer cannot use `--bare`; hooks of the host plugin therefore do run in Tier-1 children unless `--settings`/`--setting-sources` and `--plugin-dir` are controlled (`inferred`; R5 to settle).
- SDK terms: "Unless previously approved, Anthropic does not allow third party developers to offer claude web login or rate limits for their products, including agents built on the Claude Agent SDK" (`verified-doc` agent-sdk/overview). Relevant to R8; not a hook/packaging matter. The branding rules there forbid naming a product "Claude Code" (irrelevant to a plugin named `specstride`, whose skill names contain no Claude branding).
- Artifacts and UI: R13.

## A4 verification ledger

| A4 claim | Result |
|---|---|
| Manifest `.claude-plugin/plugin.json` optional; components at root | Confirmed (`verified-doc`). |
| `themes`, `monitors`, `evals` under `experimental` | Confirmed; top-level `themes`/`monitors` still load with a validate warning. |
| Commands/skills merged; `/plugin:skill` | Confirmed (skills page). |
| `userConfig` types, `sensitive`, `${user_config.KEY}`, `CLAUDE_PLUGIN_OPTION_<KEY>`, not in shell-form hooks/monitors | Confirmed. Extended: `options` (v2.1.271), `multiple`, `min/max`, `/config` rows (v2.1.269), `claude plugin install --config`. |
| `CLAUDE_PLUGIN_ROOT` changes each update; `CLAUDE_PLUGIN_DATA` survives; both exported to hook/MCP/LSP not Bash | Confirmed with correction: MCP stdio and LSP get them, monitors get neither, `CLAUDE_PROJECT_DIR` also exported to hooks/LSP. Plugin data is deleted on last-scope uninstall unless `--keep-data`. |
| Marketplace sources list | Confirmed and extended: also `command`; `archive` needs v2.1.224+. |
| Plugin cannot ship main status line | Confirmed (settings: only `agent` and `subagentStatusLine`). |
| No plugin API for detached process | Consistent with docs (`inferred` from absence). |
| Background Bash killed about 5 s after final result under `-p` | Confirmed. Extension: background subagents/workflows keep `-p` open up to a 10-minute idle wait; Monitor watch capped at 10 minutes under `-p`. |
| Plugin monitors interactive only | Confirmed. |
| `claude --bg` / `claude --bg --exec '<cmd>'` | `--bg` confirmed; `--exec` **not in `claude --help`** and not in docs: `unverified`, do not rely. State dir `~/.claude/jobs/<id>/` confirmed by docs (absent on this machine: `ls ~/.claude/jobs` no such directory, because no `--bg` session was ever started, `verified-local`). |
| Hook events `SessionStart`, `SessionEnd`, `Setup` exist | Confirmed. Setup fires only on `--init-only`, `-p --init`, `-p --maintenance`. |
| eval needs v2.1.269+; per-case 3 runs; baseline; suite layout | Confirmed. |
| Graders `regex, tool_used, tool_order, file_exists` free; `llm`, `baseline` paid; no custom-code graders | Confirmed (six types). |
| Output `results/<ts>/aggregate-result.json`, `report.html`, `--json`; CI flags; exit 0/1/2 | Confirmed; exit 143 added; results dir is `evals/results/<ts>/` by default. |
| Headless flag list | Confirmed against `--help`; `--permission-prompts`, `--restricted`, `--safe-mode`, `--forward-subagent-text`, `--include-hook-events` are additions. `--allowedTools` "only auto-approves" was not re-verified in this pass (R5). |
| `--bare` skips hooks/plugins/MCP/CLAUDE.md, requires `ANTHROPIC_API_KEY` | Confirmed (`--help` text and headless page). `apiKeyHelper` via `--settings` also accepted. |
| TS SDK `@anthropic-ai/claude-agent-sdk`; login/rate-limit restriction | Package confirmed on npm (`verified-local`, version 0.3.284); restriction sentence confirmed verbatim. |
| Only name+description resident; 1,536 cut; SKILL.md <500 lines advice | Resident/1,536 confirmed; 500-line advice not re-checked (`unverified` here). Added: 5,000/25,000 compaction re-attach budget. |
| MCP tool schemas deferred by default | Not re-verified (`unverified` here; R17). |
| `claude plugin details` projected token cost; `/skill-doctor` listing cost | `details` confirmed (`verified-local`); `/skill-doctor` not run (interactive). |
| Subagent model precedence; workflows 16 concurrent | Workflows 16 confirmed (also `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` 1-256, v2.1.269+). Model order not re-verified (R5). |
| Artifacts, MCP UI | Out of scope (R13). |

## Version/date pins

- Claude Code 2.1.284 (`verified-local`, 2026-09-29).
- Feature floors from the docs: plugin eval v2.1.269 (git check v2.1.283); `userConfig.options` v2.1.271; `/config` userConfig rows v2.1.269; MCP validation in `plugin validate` v2.1.281; `plugin validate` path checks v2.1.283; `--permission-prompts` v2.1.259; archive plugin source v2.1.224; command source v2.1.229; `output-style` in `-p` v2.1.269; workflow concurrency env v2.1.269; usage-limit wait for workflows v2.1.271.
- `@anthropic-ai/claude-code` 2.1.284 and `@anthropic-ai/claude-agent-sdk` 0.3.284 (npm registry, 2026-09-29).
- Node 22.23.2, npm 10.9.8 on this machine (`verified-local`).
- Docs are a moving target (features here are labelled `experimental` or research preview: monitors, agent view). Re-verify at feature-113 spec time.

## Options compared

Packaging: see F9. Detached runtime: see F5 table.

## Recommendation

1. **Packaging (confidence: high on A over B/C; medium on A' details).** Publish one MIT npm package `specstride` that installs a global CLI (`specstride`) and contains the Claude Code plugin directory as thin shims (A'). Register it via a marketplace entry with an `npm` source (or a relative-path/`github` source for development), set `plugin.json.version` explicitly, ship an `npm-shrinkwrap.json` only if the plugin layer ever gains dependencies. The plugin's `bin/specstride` resolves the CLI (`$SPECSTRIDE_BIN`, then PATH, then a version-pinned `npx --no-install`/`npx` fallback), calls `specstride --protocol` and refuses with a one-line doctor message on mismatch. Native components (only if the owner approves any in the Language Ledger) ship as per-platform `optionalDependencies` prebuilts on `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, never compiled at install time and never inside the plugin layer. Reject B (cannot carry native code; runtime path moves on update) and C (network at session start, silent partial installs).
2. **Runtime.** Keep the own detached Node runtime with PID + start-time + state files under project `.specstride/`; treat `claude --bg` as an optional way to keep the *host* alive, not as the runtime.
3. **Hooks (Wave 1 set).** `SessionStart` (re-attach, terse, dedup'd), `UserPromptSubmit` (delta status), `PreToolUse`+`if Bash(specstride run *)` (guardrail, defence in depth), an `asyncRewake` watcher plus an optional `on-skill-invoke` monitor for push alerts, and `StopFailure`/`Notification` logging for host-observed quota events. No `Stop`/`PostToolUse` injection. Total resident context target: skills listing plus about 100 tokens of hook output only when a run exists.
4. **Evals.** Two-tier suite as in F10: free-grader trigger suite gated per PR with pinned models and `--ablation none`, a nightly behaviour smoke with a stub CLI, and an occasional with/without ablation report.

## Matrix rows

**Host Capability Matrix, Claude Code row** (columns: host; skills; hooks; background processes; UI surfaces; packaging; evals):

| Host | Skills | Hooks | Background processes | UI surfaces | Packaging | Evals |
|---|---|---|---|---|---|---|
| Claude Code 2.1.284 (verified-local, 2026-09-29) | `skills/<n>/SKILL.md`, namespaced `/specstride:...`; listing cap 1,536 chars; body persists, 5,000-token compaction re-attach; `!` injection and `allowed-tools` pre-approval | 30+ events; command/http/mcp_tool/prompt/agent handlers; `SessionStart` stdout and `additionalContext` (cap 10,000 chars) inject context; `asyncRewake`; plugin hooks fire without skill use; not run under `--bare` | No plugin API for detached processes; Bash background dies with session (about 5 s after result under `-p`); plugin monitors interactive-only; `claude --bg` supervisor hosts model sessions (not raw commands), optional; own PID/state runtime required | Terminal text, status line (user-owned, has `rate_limits`), monitor notifications, subagent status line; artifacts and MCP UI deferred to R13 | Marketplace (relative, github, url, git-subdir, npm, archive, command); `bin/` shim on Bash PATH; `userConfig`; npm-source plugin unpacked without scripts; plugin dependency install `npm ci --ignore-scripts`; recommend npm package = CLI + thin plugin | `claude plugin eval` (v2.1.269+): 6 graders, 3 runs/arm, baseline arm, `--trust-plugin`, `--max-cost-usd`, `--threshold`, exit 0/1/2/143; `claude plugin validate --strict` |

## Open questions / risks

1. **Detached survival is unverified in this environment.** Needed spike (Wave 1, before spec 113 freezes): start a `setsid`-detached process from a Bash-tool command in interactive and `-p` sessions on Linux and macOS, exit the session, confirm the process lives and its stdio files fill; also with the Bash sandbox enabled. Docs say Claude Code kills the process tree of running Bash commands on SIGTERM, so a process that stays in the same process group would die. Not run here: it would have needed a live session (model call).
2. **`asyncRewake` lifetime and re-arming**, and whether hook stdin carries `rate_limits`: `unverified`. Plan a fallback to the monitor and the `UserPromptSubmit` delta.
3. **Hook numeric defaults** (30 s `UserPromptSubmit`, 1.5 s `SessionEnd`, 600 s others) are from a summarised page: re-read raw before speccing timeouts.
4. **Experimental surfaces.** Monitors sit under `experimental`; agent view is a research preview; plugin evals are new. Isolate each behind the CLI so a docs change costs a shim edit, not a core change (evolvability).
5. **Tier-1 child processes load the host plugin's hooks.** `--bare` disables hooks but also disables subscription auth. R5 must decide how a Tier-1 proposer child avoids re-running Specstride's own hooks and skills (`--setting-sources`, `--plugin-dir` scoping, or a scoped `--settings`). Not a `DECISIONS-PENDING` item yet, but on the critical path for feature 113/R5 and decision 6/Principle VIII (throwaway config home).
6. **Host-vs-proposer quota conflation.** `StopFailure rate_limit` describes the host session, not the detached proposer. Under Tier 1 they share an account, so the host signal is informative, under Tier 2 it is not. R14 should state which events count as pauses.
7. **npm-source plugins have no version unless set**, and updates are gated by `version`; a release process must bump `plugin.json.version` in lockstep (`claude plugin tag` validates plugin.json against the marketplace entry).
8. **claude's web app/Cowork do not install plugins containing `bin/`** (`verified-doc`): Specstride will not appear on those surfaces. That matches decision 13 but should be stated in the host contract.
9. **`worktree.bgIsolation`.** A user who runs the host in `claude --bg` gets worktree isolation by default, which conflicts with a run bound to the project checkout: doctor warning needed.
10. **No `DECISIONS-PENDING` item is required from this report.** No owner decision is contradicted. Decision 5's statement about Claude Code having no documented detach mechanism is consistent with the docs; decision 19's npm delivery is compatible with plugin `npm` sources.
