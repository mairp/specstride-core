# R4 — dsh as host

Access date for all `verified-local` items: 2026-09-29. `DSHPKG` below means
`/usr/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai` (the installed rc.8 package tree; each package README is the shipped documentation). `dsh` here is DeepSeek Harness, `@deepseek-ai/dsh` 0.1.0-rc.8, MIT.

## Prior art consulted

| Source | Used for |
|---|---|
| `dsh --version`, `dsh --help`, `dsh --profile {headless,web} --help`, `--dump-default-config` (introspection only) | CLI grammar, profile composition, plugin rows |
| `/usr/lib/node_modules/@deepseek-ai/dsh/README.md`, `package.json` | launcher, profiles, plugin management |
| `DSHPKG/{dsh-skill,dsh-skill-filesystem,dsh-tool-skill,dsh-client-ui-skill,dsh-commands,dsh-jobs,dsh-jobs-local,dsh-tool-bash,dsh-headless,dsh-user-approval,dsh-bash-sandbox,dsh-mcp-client,dsh-schedule,dsh-tool-ralph,dsh-tool-workflow,dsh-session,dsh-session-persistence-jsonl,dsh-host-plugin-inventory,dsh-host-webserver}/README.md` | skill, command, job, headless, approval, sandbox models |
| `/root/.dsh/profiles/{headless,web}/{package.json,cordis.patch.yml}`, `/root/.dsh/skills/` (listing) | how this machine mounts plugins and skills. Settings and credential files were NOT read. |
| `/root/dsh-trace-otel/{README.md,package.json,deploy/}` | a working out-of-tree cordis plugin (packaging precedent) |
| `/root/dsh-plugin-specstride/` | placeholder: Spec Kit scaffolding plus a copy of the 028 spec; no plugin code. Confirms there is nothing to reuse. |
| `/root/specstride/lib/dsh_plugin_requests.py`, `lib/critic.py:2102-2103` | how today's Specstride drives `dsh plugin` and `dsh --profile headless` (harness side belongs to R9) |
| qmd: `infra/dsh-harness-web-ui.md`, `projects/agent-otel-traces.md`, `projects/specstride-harness-plugin-research.md` | web UI fence, presets, trace plugin, earlier plugin research |
| `prompts/analysis/A4-claude-code-host-facts.md` (Claude Code side; leads, not re-verified here, R3 owns) | comparison column |

Contradicted or extended: the earlier fleet research note ("thin per-host manifests, MCP core") is extended: dsh has no plugin manifest at all (see Q1). A1 item 7 (placeholder) is confirmed.

## Questions answered

**Q1. What is dsh's plugin, skill and command model?**
Three separate mechanisms, none of which is a "plugin manifest" in Claude Code's sense.

1. *Profiles and plugins.* `dsh --profile <name>` boots `$DSH_HOME/profiles/<name>`; the tree is composed from each bundle's patch in `dsh.profile.bundles` order, then the profile's `cordis.patch.yml`, then `$DSH_HOME/cordis.patch.yml`, then `--patch` overlays. A "plugin" is a cordis module (a package exporting `apply`, with `inject`/`Config`) mounted as a row in that tree; `dsh plugin --profile <p> add <pkg>` forwards to pnpm in the profile directory. `headless` and `web` auto-initialise; any other profile must be created through `dsh plugin`. (`verified-local`: `dsh --help` output; `/usr/lib/node_modules/@deepseek-ai/dsh/README.md:11-14, 28-39`.) Nothing in a plugin package declares skills, commands, hooks or UI declaratively; a plugin's code registers them at activation.
2. *Skills.* A provider registry (`ctx.skills`). The shipped filesystem provider scans five roots in rank order: `<projectRoot>/.dsh/skills` (100), `<projectRoot>/.agents/skills` (200), `customSkillDirs` (300), `$DSH_HOME/skills` (400), `~/.agents/skills` (500); project root = nearest ancestor with `.git`, else cwd. Format: `<name>/SKILL.md` (single level; nested `**/SKILL.md` deliberately excluded) or flat `<name>.md`; frontmatter requires kebab-case `name` and `description`, optional `whenToUse`, `metadata`, `disable-model-invocation`, `user-invocable`; a wrongly-spelled or non-boolean invocation field drops the whole skill (fail closed). Body is re-read on every load; resources (`references/`, `scripts/`, `assets/`) load on demand. (`verified-local`: `DSHPKG/dsh-skill-filesystem/README.md:29-53`.) A plugin can also register its own provider (`ctx.skills.registerProvider`), including an embedded one that needs no filesystem (`DSHPKG/dsh-skill/README.md`). This machine already runs ten Spec Kit skills from `~/.dsh/skills/` with Spec Kit frontmatter (`ls /root/.dsh/skills`; `head /root/.dsh/skills/speckit-plan/SKILL.md`), so a Claude-style `SKILL.md` is accepted as-is.
3. *Commands.* `ctx.commands.register({name, description, input hint, handler})` registers a lowercase slash command for interactive adapters. Handlers return `success|error` plus UI text; that text is rendered by the adapter and **never enters model history**. Unknown slash input is rejected, not sent to the model. Only unstructured text arguments. The shipped Web client dispatches through it; "UI-less demo spines and ACP automation do not provide a command adapter", and the headless bundle mounts none. (`verified-local`: `DSHPKG/dsh-commands/README.md:5-9, 19, 39`; `DSHPKG/dsh-headless/README.md:5`.)

Skill vs command interplay: the `/name` typed in a user message is recognised on the host side (pre-step "gesture boundary" in `dsh-tool-skill`) for any user-invocable skill, "anywhere in a user message", and the rendered `<skill_content>` is injected the same way for menu pick, typed token, and TUI/ACP prompt. A name shared with a host command is resolved in favour of the command (`DSHPKG/dsh-client-ui-skill/README.md:7-9`). The model also gets a catalog (`<available_skills>` name plus description, default cap 500 chars per description) as a durable user-role message and loads bodies with a `skill(name)` tool (`DSHPKG/dsh-tool-skill/README.md`, catalog template).

**Q2. What does dsh offer for background processes?**
In-process only, owned by the session.
- `bash` with `run_in_background: true` returns `started background job <id>`, no timeout, controlled with `job_output`, `job_list`, `job_kill` (`DSHPKG/dsh-tool-bash/README.md:23, 37, 111, 139`). Jobs are owned by the calling session id.
- The registry (`dsh-jobs-local`) is process-local and in memory: "Owner disposal cancels that object's jobs"; "Service disposal ... cancels all live jobs"; max 10 concurrent jobs per owner (`DSHPKG/dsh-jobs-local/README.md:5-17`). So a job does not survive the dsh process, and there is no re-attach: same constraint as Claude Code (decision 5).
- `dsh-schedule` gives a session durable reminders (timers rebuilt from the session event log), for live root agents only (`DSHPKG/dsh-schedule/README.md`). Useful for a "check the run" nudge, not for keeping a process alive.
- `ralph` and `workflow` tools are foreground orchestration over subagents, not background runtime (`DSHPKG/dsh-tool-ralph/README.md`, `dsh-tool-workflow/README.md`).
- Sandbox: default permission mode `workspace-write` with approval policy `ask`; the bash sandbox restricts *file effects only* and explicitly does not restrict network or process visibility (`DSHPKG/dsh-bash-sandbox/README.md:15,22`; `dsh --profile headless --dump-default-config`, rows `sandbox-policy`, `approval`). Headless has no approver: requests needing approval "resolve `unavailable` and fail closed" (`DSHPKG/dsh-user-approval/README.md:62`).
- Consequence (`inferred`): a Specstride runtime launched from a dsh session must be double-forked away from the job registry by our own launcher (the same detach design as on Claude Code), and writes outside the workspace (state home, telemetry) need either `danger-full-access` (`DSH_PERMISSION_MODE`) or a workspace-local state directory. Whether a `setsid`/`nohup` child survives dsh exit, and whether the job teardown kills the whole process group, is `unverified` (needs a probe that runs a model; not run here).

**Q3. What does dsh offer for UI and status?**
- UI: only the `web` profile is a UI on this install (browser client served by `dsh-host-webserver`; slots/sidebar/trajectory/jobs/skill/subagent panels; client plugins are packages that export `./client` and declare `dsh.client`; `DSHPKG/dsh-client-modules/README.md`). The `dsh --help` example mentions a `tui` profile "assuming ... installed"; no TUI package is present in this tree (`ls DSHPKG | grep -i tui` finds only `dsh-tmux-context`), so terminal UI is `unverified`/not available. R13 owns UI design; from the host-contract view the surface is: web client slots (rich), slash commands (text), tool-result render intents (cards).
- Status: no status-line concept. Available status feeds are the session event log (append-only JSONL under `$DSH_HOME/sessions/--<cwd>--/<id>/session.jsonl.zstd`; `DSHPKG/dsh-session-persistence-jsonl/README.md`), the `sessionStats` projection, the `pluginInventory/list` remote (read-only Loader state), the `token-meter`, and `jobs` change events feeding the web Jobs panel. Session events are merge-extensible (`SessionEventMap`), so a Specstride plugin can define its own durable event types (`DSHPKG/dsh-session/README.md:73`).
- Web fence: privileged methods are pinned to a loopback Host header (qmd `infra/dsh-harness-web-ui.md`; `verified-doc`-equivalent fleet note, not re-tested): a Specstride panel reachable from a LAN address will not get settings/credential access.

**Q4. How could skill-trigger evals work on dsh (decision 15's "dsh equivalent")?**
dsh ships no eval command (`dsh --help` lists only `web` and `plugin`; `verified-local`). So the "dsh equivalent" is a Specstride-owned harness, not an upstream feature. Design that fits the observable facts:
1. Hermetic environment: `DSH_HOME=<tmp>` (the launcher and every path resolve from it; today's critic already builds a `$DSH_HOME` overlay per the trace README), a `headless` profile, a copy of the skills under test in `$DSH_HOME/skills`, `DSH_TELEMETRY_MODE=DISABLED`, a temp cwd.
2. Per case: `dsh --profile headless "<prompt>"`. Headless runs one fresh persisted session and exits (0 on completed final turn, else 1; `DSHPKG/dsh-headless/README.md:5`).
3. Grade deterministically from the session log: a `tool/call` for tool `skill` with `name=specstride-run` (model-invoked path), or an injected `<skill_content name=...>` (user-invoked `/name` path), versus none for negative cases. These are the same event names the trace plugin already consumes (`/root/dsh-trace-otel/README.md` span table: `tool/call` -> `tool/result`). Equivalent of Claude's `tool_used`, `tool_order`, `regex`, `file_exists` graders; an `llm`/`baseline` grader is optional and paid.
4. To keep it cheap: stop after the first `skill` tool result (kill the process on the first matching event, or set a low step cap) because the only question is whether the skill loaded.
5. A free layer exists: lint the catalog projection (name, description length under the 500-char catalog cap, `disable-model-invocation`/`user-invocable` booleans valid) without any model call.
Costs: cases 1 and 2 make real provider calls (the harness can run against any configured provider; a cheap DeepSeek-class model is the default composed model `deepseek-official/deepseek-v4-flash` per `--dump-default-config`, so cost is low but not zero). No 3-run baseline mechanism exists; the runner must implement repetition and the no-plugin baseline (an empty skills directory).
Contract implication: the eval runner is a `HostEvalDriver` port with two implementations: `claude plugin eval` passthrough (native) and the session-log driver above.

**Q5. How is the doctor exposed (decision 14)?**
- Truth: one engine function, `specstride doctor [--json]` on the CLI (no host dependency).
- Claude Code: `/specstride:doctor` is a skill (plugin skills are namespaced; A4 "Plugin layout"), which shells out to the CLI and prints terse output.
- dsh, three layers, cheapest first: (a) a skill `specstride-doctor` with `disable-model-invocation: true` and `user-invocable: true`, so it is never in the model's catalog (zero resident tokens) yet works as `/specstride-doctor` in any dsh surface including headless (the gesture boundary is in `dsh-tool-skill`, host-side); the body tells the model to run the one CLI command and relay the output. This is the Wave 2 minimum. (b) A cordis plugin registering `ctx.commands.register('specstride-doctor')` whose handler runs the engine directly, so the output is rendered by the adapter and never enters model history: better for decision 16, but only available on adapters that mount `dsh-commands` (web, not headless). Name collisions resolve in favour of the command. (c) A web panel (R13).
- dsh has no colon namespace: `/specstride:doctor` cannot exist. Names are kebab-case (`specstride-doctor`). The host-shell contract must therefore carry a logical id (`doctor`) and let each host map it to its spelling. (`verified-local`: skill name must be kebab-case, `DSHPKG/dsh-skill-filesystem/README.md:53`; command name is "lowercase ... letters, digits, `_`, `-`", `DSHPKG/dsh-commands/README.md:7`.)

**Q6. How far does ONE host-shell abstraction stretch over Claude Code and dsh?**
See the table below. Summary: they share the *capabilities* and the *engine boundary*; they do not share the *package format*, *hook system* or *eval runner*. The abstraction is a port (TypeScript interface plus a per-host generator/adapter), not a shared plugin artifact.

| Concern | Claude Code (A4, R3-owned, unverified here) | dsh (this report) | Verdict |
|---|---|---|---|
| Skill file | `skills/<name>/SKILL.md` in plugin, `/plugin:skill` | `<name>/SKILL.md` in a scanned root; `/name` | COMMON: same SKILL.md body, frontmatter is a subset-compatible superset. Generate per host. |
| Skill listing cost | name plus description (cut at 1,536 chars incl. `when_to_use`) | name plus description (cut at 500 chars) | COMMON concept; budget must use the stricter (500). |
| Invocation policy | `disable-model-invocation`, `user-invocable` exist on both (dsh drops the skill on a bad value) | same names, strict booleans | COMMON, but validate booleans strictly. |
| Manifest / packaging | `.claude-plugin/plugin.json`, marketplace, `${CLAUDE_PLUGIN_ROOT/DATA}` | none; skills in a directory, plugins are npm cordis packages installed with `dsh plugin add` into a profile | HOST-SPECIFIC. |
| Hooks | `hooks/hooks.json`, SessionStart/End etc. | none user-facing; in-process cordis events (`agent/pre-step`, `tools/pre-execute`, `session` events) available only to code plugins | HOST-SPECIFIC; decision 8's "host hooks" candidate does not exist on dsh. |
| Background | none documented; `claude --bg` supervisor exists | in-process jobs only, die with owner | COMMON gap: engine owns detach (decision 5). |
| Commands | skills only | commands (web only) plus skills | dsh extra; map `doctor` to either. |
| UI | no plugin UI API; monitors/artifacts | web client slots | HOST-SPECIFIC (R13). |
| Status | `subagentStatusLine` only | session event log, projections | HOST-SPECIFIC; engine status file is the common feed. |
| Tools schema residency | MCP deferred by tool search | tools always resident in the base composition; MCP tools registered as `mcp__<server>__<tool>` via `dsh-mcp-client` | dsh cost is higher: prefer CLI-over-bash to MCP (decision 16). |
| Evals | `claude plugin eval` | none; build a session-log driver | HOST-SPECIFIC implementation behind a common port. |
| Engine call | Bash tool running `specstride ...` | `bash` tool running `specstride ...` (or MCP) | COMMON: a versioned, terse `--json` CLI is the contract. |
| Auth/sandbox | Claude permission modes | permission preset (`workspace-write`/`ask` default; headless fails closed on approval) | HOST-SPECIFIC; the skill must not depend on approvals in headless. |

Can dsh share the host-shell contract at all? Yes at the capability level (skills, engine-through-CLI, doctor, status via files), so this is **not** a "cannot share" finding for §4 R4's risk row. Two contract members degrade (hooks, evals) and one is absent (packaging equivalence), and these must be expressed as optional capabilities with declared fallbacks. Details in Recommendation.

## Findings

| # | Claim | Tag | Evidence |
|---|---|---|---|
| F1 | dsh is `0.1.0-rc.8`, MIT, npm package `@deepseek-ai/dsh`; commands are `web` and `plugin`, flags `--profile --patch --dump-config --dump-default-config`. | verified-local | `dsh --version` -> `0.1.0-rc.8`; `dsh --help`; `package.json` `"license": "MIT"` |
| F2 | dsh has no plugin manifest with declared skills/commands/hooks; a plugin is a cordis module mounted by a `cordis.patch.yml` row. | verified-local | `README.md:28-39`; `/root/.dsh/profiles/headless/cordis.patch.yml` (inserts `trace-otel` by path) |
| F3 | An out-of-tree plugin can live outside the global package (npm upgrade does not remove it) and must fail open, because cordis aborts boot when a mounted module fails to import. | verified-local | `/root/dsh-trace-otel/README.md` ("Fail-open design", "Mount") |
| F4 | Skill roots: `.dsh/skills`, `.agents/skills`, custom, `$DSH_HOME/skills`, `~/.agents/skills`. | verified-local | `DSHPKG/dsh-skill-filesystem/README.md:33-39` |
| F5 | `~/.agents/skills` is a shared cross-agent root, so one SKILL.md directory can serve dsh and any other agent that reads that root. | verified-local (dsh side); `unverified` (which other hosts read it) | same file; only dsh checked |
| F6 | Skill catalog descriptions are capped at 500 chars by default; catalog is resident every session; bodies load on demand. | verified-local | `DSHPKG/dsh-tool-skill/README.md` ("catalogDescriptionMaxLength ... default 500") |
| F7 | A skill with `disable-model-invocation: true` is excluded from model catalogs and loaders but stays user-invocable through `/name`. | verified-local | `DSHPKG/dsh-skill-filesystem/README.md:55`; `DSHPKG/dsh-client-ui-skill/README.md:7` |
| F8 | Command handler output is rendered by the adapter and never enters model history; unknown slash commands are rejected. | verified-local | `DSHPKG/dsh-commands/README.md:9,19` |
| F9 | Headless profile: one task, one fresh persisted session, prints the last assistant text, exit 0/1, no follow-up, no commands adapter. | verified-local | `DSHPKG/dsh-headless/README.md:5,19`; `dsh --profile headless --help` |
| F10 | dsh background jobs are process-local and cancelled on owner or service disposal; max 10 per owner; no timeout. | verified-local | `DSHPKG/dsh-jobs-local/README.md:5-17`; `dsh-tool-bash/README.md:139` |
| F11 | No approver in headless; approval requests fail closed. Default mode `workspace-write` + `ask`; `DSH_PERMISSION_MODE=danger-full-access` switches to `never`. | verified-local | `DSHPKG/dsh-user-approval/README.md:62`; `--dump-default-config` rows `sandbox-policy`, `approval` |
| F12 | Bash sandbox confines file effects only, not network. | verified-local | `DSHPKG/dsh-bash-sandbox/README.md:22` |
| F13 | Sessions are durable JSONL under `$DSH_HOME/sessions`; event types are extensible by plugins; tool events `tool/call`, `tool/result`, `turn/*`, `step/*` exist. | verified-local | `DSHPKG/dsh-session-persistence-jsonl/README.md`; `/root/dsh-trace-otel/README.md` span table |
| F14 | dsh has no eval command and no user-facing hook config. | verified-local (absence in `--help`, package list, READMEs) | `dsh --help`; `grep -i hook` over READMEs finds only in-process cordis hooks and a "hook bridges' `hook/*`" event mention with no bridge package installed |
| F15 | MCP servers are one cordis row each and register tools as `mcp__<server>__<tool>`; tools are resident in the base composition. | verified-local (row shape); `inferred` (residency cost, no tool-search deferral found) | `DSHPKG/dsh-mcp-client/README.md:9`; no deferred-tool feature found in `dsh-tools` README |
| F16 | Today's Specstride already drives dsh by `dsh --profile headless` and `dsh plugin add --save-exact` under an exact-allowlist request contract, guarded by a profile lock file. | verified-local | `/root/specstride/lib/dsh_plugin_requests.py` (contract `specstride-dsh-plugin-request/v1`, `command = [dsh_bin, "plugin", "--profile", profile, "add", "--save-exact", ...]`); `/root/.dsh/profiles/headless/.specstride-plugin-install.lock` exists; `lib/critic.py:2102-2103` |
| F17 | `/root/dsh-plugin-specstride/` holds no plugin code (Spec Kit scaffolding plus the 028 spec copy). | verified-local | `find /root/dsh-plugin-specstride -type f` |
| F18 | The interactive UI on this install is the web client only; no TUI package is installed. | verified-local (tree listing); a TUI could be added through `dsh plugin add` (`unverified`) | `ls DSHPKG`; `dsh --help` example wording |
| F19 | The default composed model is `deepseek-official/deepseek-v4-flash`; the machine's own profiles override providers through a gateway. | verified-local | `--dump-default-config` row `agent-default-model` |
| F20 | dsh version churn is real: the trace plugin "tracks an rc seam" and needs re-test after any dsh upgrade; an older fleet note says to upgrade to >=0.1.7 for `--json`, but rc.8 shows no `--json` flag in `--help`. | verified-local (trace README; `--help`); the version ordering of the fleet note is `unverified` (rc.8 vs 0.1.7 not resolvable from local data) | `/root/dsh-trace-otel/README.md` "Known limits"; qmd `specstride-harness-plugin-research` |

## Version/date pins

| Item | Pin | Verified on |
|---|---|---|
| dsh | `0.1.0-rc.8` (rc: internals may change; every dsh-host statement is `verified-local` against this exact build) | 2026-09-29 |
| Recorded range for the doctor (decision 10) | `>=0.1.0-rc.8 <0.1.0` (rc series only; widen after a stable release is tested) | 2026-09-29 |
| Node | >=22 (`engines` of the trace plugin; Node 22 installed) | 2026-09-29 |
| Claude Code side | 2.1.284 installed; A4 facts NOT re-verified here | 2026-09-29 |
| Not used | official public dsh documentation URL: none consulted; the shipped package READMEs served as documentation. The package's `repository` field is `github.com/deepseek-ai/deepseek-harness` (`apps/cli`). Public docs may differ; R9 or a verifier should compare. | n/a |

## Options compared

Wave 2 packaging and doctor exposure for dsh.

| Option | Description | Context cost | Doctor exposure | Status feed | Evolvability | Risk / cost |
|---|---|---|---|---|---|---|
| A. Skills only | Ship `specstride-run`, `specstride-reverse`, `specstride-doctor` as plain SKILL.md dirs (installed by the npm package into `~/.dsh/skills` or `.agents/skills`), engine reached via `bash` + `specstride ...` | 2 catalog entries (doctor hidden by `disable-model-invocation`) | user-invoked skill | none besides engine status file | Highest: no dsh-internal API touched | doctor output passes through the model; no slash-menu UX beyond skill picks; no rc-seam dependency |
| B. A plus cordis plugin | Adds `ctx.commands` doctor/status commands, optionally a skills provider, a web panel | Same catalog; command output outside history | native command | session events plus custom `SessionEventMap` types | Medium: couples to rc seams (F20), needs fail-open discipline (F3) | Tests per dsh upgrade; only web has a command adapter |
| C. MCP server (`specstride mcp`) via `dsh-mcp-client` | Engine tools as MCP | Resident tool schemas every turn (F15) | tool call | tool results | Good portability across hosts | Worst for decision 16 on dsh; earlier fleet note preferred MCP core, but its cost is higher here than on Claude Code |
| D. Third-party dsh as proposer only (no host plugin) | R9's scope | none | none | none | n/a | Does not deliver decision 13 Wave 2 |

## Recommendation

**Wave 2 host-dsh: option A as the contract, B as an optional add-on behind the same port. Confidence: medium-high (0.75) on the structure; medium (0.55) on the detach and sandbox behaviour until probed.**

1. **Define the host-shell abstraction as a capability port, not a shared plugin artifact.** Contract members: `skills` (logical id, name spelling, description, budget), `engineCall` (CLI verbs with terse default and `--json`; the only channel from host to engine), `doctor` (logical id mapped to `/specstride:doctor` or `/specstride-doctor`), `status` (reads the engine's status file and events; hosts may add richer views), `detach` (owned by the engine, not the host), `evals` (a `HostEvalDriver`), `uiSurface` (optional; R13), `hooks` (optional; declared absent on dsh). Each host package (`host-claude`, `host-dsh`) is a generator plus a thin installer; the SKILL.md bodies are generated from one source so they cannot drift.
2. **Budget to the stricter host.** Use the dsh 500-char catalog description cap and kebab-case ids as the common minimum; use Claude's namespacing only in the Claude generator.
3. **Doctor on dsh: user-only skill first** (`specstride-doctor`, `disable-model-invocation: true`), command second (add a `ctx.commands` handler only if the web UI needs it, per R13). The doctor's real work is `specstride doctor`, so the three exposures (decision 14) differ only in a 5-line wrapper.
4. **Evals on dsh: build the session-log driver** described in Q4 and put it behind the common `HostEvalDriver` port; the Claude implementation delegates to `claude plugin eval`. Ship a free catalog lint plus the paid trigger cases; cap cost per suite.
5. **Do not rely on hooks on dsh.** Quota and budget alerts (decision 8) come from the engine: status file, digest and supervision cycles, not host hooks. If R3 finds Claude hooks worth using, they are an optional accelerator, not part of the contract.
6. **Prefer CLI over MCP on dsh** for context (F15). Keep MCP as an optional generic binding only.
7. **Detach and sandbox:** the engine's launcher must fully detach (own session and process group, state in the workspace or a state home the sandbox permits) and must not depend on approvals; the skill must state the required permission mode in one line and the doctor must warn if `DSH_PERMISSION_MODE`/sandbox blocks the state directory. Probe this with one paid-model-free test when a model call is allowed: a `dsh --profile headless` run that starts a `setsid` sleeper and check it after exit.
8. **Isolate from rc churn:** any cordis plugin (option B) is fail-open per the `dsh-trace-otel` pattern, lives outside the global package, and is version-gated by the doctor against the recorded range.

## Matrix rows

Host Capability Matrix (columns: host; skills; hooks; background processes; UI surfaces; packaging; evals):

| Host | Skills | Hooks | Background processes | UI surfaces | Packaging | Evals |
|---|---|---|---|---|---|---|
| dsh 0.1.0-rc.8 (verified-local, 2026-09-29) | `<name>/SKILL.md` in 5 scanned roots (`.dsh/skills`, `.agents/skills`, custom, `$DSH_HOME/skills`, `~/.agents/skills`); model catalog (500-char cap) plus `skill` tool; `/name` user invocation; `disable-model-invocation` / `user-invocable` | No user-facing hook config; in-process cordis events for code plugins only (`agent/pre-step`, `tools/*`, session events) | In-process jobs (`bash run_in_background`, `job_output/list/kill`), die with owner/process, max 10 per owner; `dsh-schedule` reminders; no detached/re-attach; engine must self-detach | Web client only on this install (slots, jobs/skill/subagent panels, loopback-fenced settings); slash commands via `ctx.commands` (web only, output outside model history); no TUI installed; no status line | No manifest: skills = directory copy; plugins = npm cordis packages via `dsh plugin add` into a profile (pnpm), mounted by `cordis.patch.yml`; must fail open | None upstream; build a session-log driver (`DSH_HOME` sandbox + `dsh --profile headless` + JSONL grading of `skill` tool calls); no baseline or repetition support |

## Open questions / risks

1. **DECISIONS-PENDING candidate (evals scope):** decision 15 says "and the dsh equivalent", but no such tool exists. The default I proceed on: Specstride builds a small session-log eval driver (Q4) as part of feature 120-host-dsh, tests included in Wave 2. If the owner rules it out of scope, dsh ships with catalog lint only and trigger correctness on dsh is unverified.
2. **DECISIONS-PENDING candidate (hooks):** decision 8 lists host hooks as a candidate alert mechanism; dsh has none. Default: alerts are engine-emitted and surfaced by supervision, with hooks optional per host. If the owner wants hook-based alerts as a requirement, dsh needs a custom cordis plugin (option B) and the requirement becomes host-conditional.
3. Not a "cannot share the contract" finding: no ruling needed on the abstraction itself. If R3/R17 later prove the Claude side depends on hooks or plugin-only features for correctness, revisit.
4. Detach survival and process-group kill on session teardown, and whether background children inherit the sandbox, are `unverified` (no model probe run; forbidden without explicit allowance).
5. Only the web UI exists locally; the headless profile cannot host a supervision loop (one task, no follow-up). Interactive `specstride-run` on dsh therefore means the web profile (or a TUI not verified). R13 should confirm what Wave 2's "kanban UI" means for a dsh host.
6. rc churn: `0.1.0-rc.8` is a release candidate; the fleet note claims a `--json` mode in `>=0.1.7` that rc.8 does not show. Any host-dsh feature that touches internals (option B) needs a re-test per upgrade; option A does not.
7. Public dsh documentation was not consulted (only shipped READMEs). A verifier should check that skill-root semantics and the command registry are documented publicly, since decision 19 targets external consumers.
8. Whether other hosts (Codex, pi) also read `~/.agents/skills` (F5) is unverified; if true, one skill directory could serve several hosts, which would strengthen option A (R6/R7 may know).
9. The harness side of dsh (headless as proposer/critic, model/provider qualifiers, stream format, quota signal) belongs to R9; the observability seam (`dsh-trace-otel` events, TRACEPARENT) belongs to R14.
