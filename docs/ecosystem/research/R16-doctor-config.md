# R16 — Doctor and config

Author: research agent R16, 2026-09-29. Batch 2. Governing text: decisions 6, 7, 8, 9, 10, 14, 17. No paid calls were made. No credential file was read. `/root/specstride/.env` exists on this machine and was **not** opened; the `.env.example` template was read instead.

Path shorthand used below: `SS` = `/root/specstride` at `9cab15d`; `MOL` = `/root/mixture-of-loops` at `9c88f86` (via `git show`); `LISA` = `/root/lisa` local `main` `363e6a3` (via `git show`); `Rn` = `/root/specstride-claude/docs/ecosystem/research/Rn-*.md`.

## Prior art consulted

| Source | What was read | Reused, extended or contradicted |
|---|---|---|
| `LISA packages/cli/src/commands/doctor.ts` (whole file) | Finding model `{check, severity, problem, evidence, remedy, autoFixable}`; injected probes (liveness, gateway, telemetry, runtime versions) so the suite is deterministic; async probes awaited before the synchronous suite; exits `0` healthy, `2` findings, `1` probe error; `--fix` limited to a safe list | **Reused**: the finding model, injected probes, stable dotted check ids (`state.stale_lock`), telemetry never fatal, "no silent fallback" for models. **Extended**: JSON output, a token budget, severities that separate "run would be refused" from "advice", tested/unverified harness rows, terms and quota checks. **Contradicted**: Lisa counts every `warn` as exit 2 (so a routine advisory makes the doctor exit non-zero), and its `--fix` changes state (see Recommendation 3). Lisa's README documents an exit 3 that the code never returns (R19 D-18). |
| `LISA packages/sdk/src/config.ts`, `.env.example` | zod-validated profiles with `.strict()`; `redactProfile` as the single serialization choke point; `LISA_*` variables; no `.env` loader anywhere in `packages/*/src` (`git grep -i dotenv` finds none) | **Reused**: strict schema (unknown key is an error), one redaction choke point. **Recorded**: Lisa's "config" is process environment only; `.env.example` is a template a shell must export (R19 D-19: several variables have no reader). Lisa is a layer-1 (env) and layer-0 (defaults) system, nothing else. |
| `SS orchestrator.sh:177-194, 202-231, 233-262, 640-685, 1642-1690`; `SS specstride:577-628`; `SS lib/specstride_env.py`; `SS .env.example` | The as-is layers, in code | Placed in the order below. |
| `MOL skills/mixture-of-loops/scripts/runtime.py:112-146, 320-336`; `references/contract.md` (`configuration.auto`, `configuration.learning`) | The contract's own configuration and the one place it beats the environment | Placed below. |
| R3, R3v, R4, R5–R7, R9, R10 | Host mechanics, `userConfig`, managed settings caveat (R3v C5), doctor exposure per host (R4 Q5), version pins | Pins copied into the appendix; doctor exposure taken as given. |
| R8, R8v | Terms gate, audiences A/B, corrected matrix | Gate data is an input to `terms.gate`; R8v wins where it downgrades. |
| R11 | T-13 (project config narrows only), T-27, T-29, T-35, containment levels | Drives the `scope` column and the inline-secret check. |
| R14 | Quota classes, pause record, budgets, alerts, event schema | Drives `quota.*`, `budget.*`; R16 defines keys only. |
| R17 | Doctor budget 1,500 tok, F13 compact output, `doctor --quick` startup gate | Drives the output design. |
| R20 | Seven discovery sources, descriptor schema, critic order and auto-pick qualification Q1–Q8, proposed `critic.autoPick` names | Drives `harness.*`, `critic.*` checks; R16 fixes the names. |
| R2 | Directory lock (F-9), no `flock` in Node | Drives `run.lock`. |
| R13 | `specstride ui` loopback, random token, Host/Origin checks | Drives `ui.endpoint`. |
| `DECISIONS-PENDING.md` (DP-001..DP-042) | Defaults the effort proceeds on | Cited by number. |
| External | `claude doctor --help`, `claude auth status --help`, `codex login status --help`, `gh auth status --help` run locally (help only). `https://code.claude.com/docs/en/settings` and `/managed-settings` fetched 2026-09-29. | See prior-art table in Findings. `flutter` and `brew` are not installed here and the Flutter install page returned 404; their behaviour below is recalled and tagged `unverified`. |

## Questions answered

**Q1. What should the doctor copy from prior art?** Answer in F1: from `claude doctor` the "reads settings without a trust prompt, no model call" contract and a separate full interactive checkup; from `flutter doctor` the one-line-per-area summary with a `-v` expansion; from `brew doctor` the rule "print only what is wrong, each with what to do" and "warnings are not failures"; from `gh auth status` a per-host auth line that never prints the token unless asked and an exit code that reflects state; from Lisa the finding model and injected probes.

**Q2. What is the check catalogue?** Table in F3: 44 checks, each with id, inspects, safe method, severity, message and fix.

**Q3. What does the output look like and what are the exit codes?** F4. Terse by default: one line when healthy, at most 7 finding lines otherwise, about 610 host tokens worst case, inside the 800-token failure allowance of R17 (doctor total 1,500). `--json` has a versioned schema. Exit codes `0`, `1`, `2`, `3`.

**Q4. What is the full config schema?** F6, with scope flags per key (flag, env, project, user), the trust class from R11 T-13, and per-phase overrides for proposer and critic.

**Q5. Where do the as-is layers go in decision 9's order?** F5: eleven layers placed; three are divergences, one is a latent defect the port must not carry, and one is a new layer (the run snapshot) needed to make decision 23 coherent.

## Findings

### F1. Prior art: what each does well and what to copy

| Tool | Does well | Copy | Do not copy | Tag |
|---|---|---|---|---|
| `claude doctor` | Help text: "Check the health of your Claude Code installation. Reads settings files in the current directory without a trust prompt. For a full checkup that can also fix issues, run /doctor in a session." Non-interactive form is read-only; the fixing form is a separate, interactive command. | Two levels: a read-only CLI form that any host can call, and no fixing in the default form. Read project config for diagnosis without executing anything from it. | Nothing to avoid; note it gives no `--json` in 2.1.284 (`claude doctor --help` lists only `-h`). | `verified-local`: `claude doctor --help`, claude 2.1.284, 2026-09-29 |
| `claude auth status` | `--json` (default) or `--text`; a pure state read. | The pattern "auth probe = the CLI's own status subcommand". Show method and logged-in state; never print the account identifier (it carries an email). | | `verified-local`: `claude auth status --help` |
| `codex login status` | Exists; `-c key=value` override accepted. | Same pattern for Codex. | | `verified-local`: `codex login status --help` |
| `gh auth status` | Per-host block, "report on any issues"; `-t/--show-token` is an explicit opt-in to reveal the token; `-h/--hostname` narrows. | Per-provider lines; secrets only behind an explicit flag (Specstride will have no such flag: the doctor never prints a secret value). Narrowing flag (`--role`, `--harness`). Exit code follows state. | `--show-token` (no equivalent wanted). | `verified-local`: `gh auth status --help` |
| `flutter doctor` | One line per area with a status glyph, summary count at the end, `-v` for detail; each issue carries a fix instruction. | Area-grouped summary and `--verbose`. | Its runtime is slow because it shells out to many tools; the doctor must have a `--quick` mode (R17 startup gate). | `unverified`: recalled, tool not installed here |
| `brew doctor` | Silent-when-healthy ("Your system is ready to brew"); prints only problems with an explanation and a remedy; states that warnings do not always mean failure. | Print nothing but the summary when healthy; separate advisory from failure. | Long prose per warning (token cost). | `unverified`: recalled, tool not installed here |
| Lisa `doctor` | See prior-art table above. | Finding model, injected probes, stable ids, telemetry informational, model availability with no silent fallback. | Exit 2 on any warn; `--fix` as a general facility. | `verified-local`: `LISA doctor.ts` header comment and `doctor()` function |

### F2. Doctor ground rules (apply to every check)

1. **Read-only.** The Wave 1 doctor writes nothing: no state, no config, no file. Every finding carries a printed fix command instead. Lisa's `--fix` (stale lock removal, orphaned worktree cleanup) is deferred: `specstride doctor --fix <check-id>` may come later, explicitly named per check, never a blanket flag. This is the reading of "always without changing state" that the assignment demands. (`inferred` from the assignment; Lisa's `--fix` is the contrary prior art.)
2. **No paid call.** No model is invoked. A check may run: `command -v`, `<bin> --version`, a harness's own status subcommand (`claude auth status`, `codex login status`), a descriptor's declared probe argv, a `stat`, or a free `GET` on a models endpoint (R20 S5/S6; DP-026 default: allowed, GET only, redirects refused so a credential cannot leak to another host, LiteLLM `/health` never called because it makes real requests, R20 F12).
3. **No secret read.** Presence of an `env:` reference is `name in process.env`; a `file:` reference is `stat` only (existence, mode, owner, location outside the workspace); a keychain reference is checked for existence only where the platform tool can do that without emitting the value (macOS `security find-generic-password` without `-w`/`-g`). On Linux `secret-tool lookup` prints the secret and is **not** used; the check reports `unprobed` (`unverified`: exact non-printing existence query for Linux keychains was not found; needs a spike). Credential stores (`auth.json`, `.credentials*`) are never opened (R20 S3 deny-list).
4. **Bounded.** Each subprocess: stdin closed, 5 s timeout, output capped at 64 KiB, run in parallel (R20 S2). `--quick` skips subprocess and network checks (target under 300 ms, R17 startup gate item 7).
5. **The doctor never blocks a run** by being unhealthy. It is advisory. The launch path re-runs a fixed **launch-blocking subset** (marked `LB` below) as preflight and refuses; the doctor labels which of its findings are the same checks. The critic-diversity warning is not in that subset (decision 7). This keeps the doctor free of execution power and makes evolvability cheap: a new check is data plus a function, and does not touch the engine.

### F3. The check catalogue

Severity: `ok`, `info`, `warn` (advice; exit 0), `fail` (a run would be refused or would misbehave; exit 2). `LB` = the same test runs at launch and refuses. Ids are dotted, stable and never renamed (they appear in `--json` and in events). Messages are one line of at most 200 bytes.

| # | id | Inspects | How (safe) | Severity | Message (template) | Fix hint |
|---|---|---|---|---|---|---|
| 1 | `env.node` | Node version | `process.version` | `fail` below floor; `warn` if not LTS | `node 22.23.2 ok (needs >=22)` / `node 18.x too old (needs >=22)` | install Node 22 or later |
| 2 | `env.os` | Platform | `process.platform`, `os.release()` | `ok` Linux/macOS; `warn` Windows or WSL | `linux ok` / `wsl: unvalidated (decision 12)` | run on Linux or macOS for supported behaviour |
| 3 | `env.git` | git present | `git --version` | `warn` (checkpoints off without it) | `git missing: checkpoints disabled` | install git |
| 4 | `env.stateDirPerms` | state dir mode | `stat`: dir `0700`, files `0600` (R11 T-29) | `warn` | `.specstride is group/world readable` | `chmod -R go-rwx .specstride` |
| 5 | `env.tmpWritable` | state dir writable, free space | `access()`, `statfs` | `fail` if not writable; `warn` under 1 GiB | `state dir not writable` | fix permissions or set `state.dir` |
| 6 | `cli.version` | This CLI vs the plugin's expected protocol (R3 rec. 1: `specstride --protocol`) | compare protocol ints | `fail` on mismatch | `plugin expects protocol 1, cli has 2` | `npm i -g specstride@<x>` (printed, never run, R11 T-46) |
| 7 | `host.plugin` | Which host is calling; plugin version | host passes `--host claude-code|dsh|cli` | `info` | `host claude-code 2.1.284, plugin 0.1.0` | none |
| 8 | `host.claudeFloor` | Claude Code version floor for used features (e.g. `userConfig.options` needs 2.1.271, R3v item 9) | `claude --version` | `warn` below floor | `claude 2.1.260 lacks userConfig options (needs 2.1.271)` | `claude update` |
| 9 | `host.managedSettings` | Managed (policy) settings present on this machine | `stat` of `/etc/claude-code/managed-settings.json` and `managed-settings.d/` (Linux, WSL); `/Library/Application Support/ClaudeCode/managed-settings.json` (macOS); `C:\Program Files\ClaudeCode\` (Windows). Existence only, contents not read. | `info`; `warn` if the Tier 1 child would load a policy hook | `managed settings present: a policy hook may run in Tier 1 children` | review policy; adapter asserts `system/init` (R3v C5) |
| 10 | `host.bgIsolation` | `worktree.bgIsolation` when the host runs in `claude --bg` (R3 risk 9) | read the non-secret settings key | `warn` | `bg worktree isolation on: run is bound to project checkout` | disable for this project |
| 11 | `bin.<id>` (one per harness in use) | Binary on PATH | `command -v <descriptor.detect.binary>` | `fail` if a configured role needs it (LB); `info` if merely absent | `codex not found (critic role)` | install, or change `roles.critic.harness` |
| 12 | `harness.discovered` | Registry from R20 sources S1–S7 | passive pass, no network; registry written to run state at launch | `info` | `claude tested; dsh tested; deepseek unverified(declared)` | none |
| 13 | `harness.state.<id>` | Tested vs unverified per discovered harness, with sub-state `detected|declared|locally-verified` | from the adapter/descriptor | `info` tested; `warn` if an unverified harness is selected for a role | `deepseek unverified: no version pin, capabilities declared, Tier 1/2 only` | `specstride harness verify deepseek` (opt-in, budget-capped, R20 F16) |
| 14 | `harness.version.<id>` | Installed version vs tested range and `verified-on` (decision 10) | `<bin> --version` (never `copilot version`, which calls the network, R7) | `warn` outside range; `info` inside; `info` if `verified-on` older than `doctor.staleAfterDays` | `codex 0.154.0 outside >=0.153.4 <0.154 (verified 2026-09-29)` | pin or downgrade; run conformance |
| 15 | `harness.caps.<id>` | Declared vs probed capability mismatch (e.g. declared window vs effective, R9 F18 and risk 5) | descriptor probe L1 (help/flag presence) | `warn` | `prime window declared 200k, effective 98k` | set `harnesses.<id>.window` |
| 16 | `harness.denylist.dsh` | dsh tool plugin ids not covered by the tool-less critic disable list (R9 risk 2) | `dsh` listing subcommand from the adapter; compare to shipped list | `warn` | `dsh exposes 2 plugin ids not in the critic denylist` | update Specstride or restrict dsh |
| 17 | `auth.<id>.<role>` | Logged in / credential present | Tier 1: adapter's status subcommand (`claude auth status`, `codex login status`); Tier 2: `env:`/`file:`/keychain presence; none available: `unprobed`. Account identifiers are never printed. | `fail` if missing for a used role (LB); `info` `unprobed` | `claude: logged in (subscription)` / `codex: not logged in` | `claude auth login` (user runs it), or set `roles.critic.credential=env:OPENAI_API_KEY` |
| 18 | `auth.tier.<role>` | Tier in effect and billing mode | resolved config plus auth result | `info`; `warn` (loud) when an API key is in effect (decision 8 alerts are loudest for API keys) | `proposer: tier2 API key, cap $25` | none |
| 19 | `model.reach.<role>` | The configured model is served | free `GET <modelsPath>` (endpoint kinds), or `list-models` argv from the descriptor (`pi --list-models`); for `claude` the `capabilities`/model alias set from `system/init` is only known at run time, so the doctor reports `known at first call` | `fail` if the model is not listed (LB, "no silent fallback"); `info` if `unprobed`; skipped with `--offline`/`--quick` | `deepseek-v4-pro not in /models` | choose a listed model |
| 20 | `model.window.<role>` | Context window known and provenance | descriptor/adapter/probe/catalogue | `warn` if unknown and the harness would be a critic candidate | `window unknown: harness cannot be auto-picked as critic` | `harnesses.<id>.window` |
| 21 | `critic.diversity` | Critic vs proposer: provider id or model id differ (R20 Q4) | resolved roles | `warn` if same model; `info` if same provider, different model or tier; never `fail` | `critic = proposer model claude-opus-4-8 (same-model setup)` | configure a second harness, or accept |
| 22 | `critic.independence` | Critic session is fresh, tool-less, with a budget | resolved profile + adapter capability (`toolless: structural|configured|no`) | `warn` if `toolless=no`; `fail` if the critic has an allow-all flag (R11: no critic path gets one) (LB) | `critic can call tools (codex exec read-only, DP-001)` | use an endpoint-kind critic |
| 23 | `critic.autopick` | The pick the plugin would make, and why each other candidate lost (R20) | run the ranking on the registry, no launch | `info` | `would pick: deepseek/deepseek-v4-pro (rung 3, declared, window 1048576); off: critic.autoPick=false` | set or disable `critic.autoPick` |
| 24 | `terms.gate` | Provider, tier, audience against the gate data (R8v corrected matrix) | table lookup, dated | `fail` if refused (LB, cannot be bypassed); `warn` if conditional or unknown; `info` if allowed | `claude tier1 audience=distributed: refused by default (DP-042); set distribution.audience or use an API key` | switch tier, or `distribution.audience: personal` in user config |
| 25 | `terms.stale` | Gate data age | `checkedOn` field vs today | `warn` if over 30 days (DP-020 says re-check every 30) | `terms data checked 2026-09-29, 45 days old` | `npm update specstride` |
| 26 | `terms.audience` | Which audience is in force and where it was set | resolved config | `info` | `audience personal (user config)` | none |
| 27 | `quota.state.<role>` | Last observed quota/pause state from run state and events (R14 `pause.record`, `RunView.budget[]`) | read files and last events; no probe | `info` ok; `warn` window nearing threshold; `warn` paused-quota with resume time; `fail` `quota_credit` blocked | `proposer paused-quota until 15:45 (5h window)` | wait, or configure `fallback` |
| 28 | `budget.caps` | Caps in force per role/run; billing mode; unverified harness spend not measurable (R11 T-18) | resolved config + last usage | `info`; `warn` if API key with no cap (LB when auto-picked metered critic: cap is mandatory, DP-025) | `run cap $25, critic cap $2; deepseek spend not measurable (wall-clock cap only)` | `budget.role.critic.costUsd` |
| 29 | `quota.shared` | Subscription shared with an interactive host session (R3 risk 6, R14) | Tier 1 for the same provider as the host | `info` | `detached run and this session share the claude window` | none |
| 30 | `config.schema` | Every layer parses and validates against schema `specstride.config/1`; unknown keys are errors | zod-style strict parse of user and project files | `fail` (LB) | `specstride.yaml: roles.critc.harness unknown key (did you mean roles.critic?)` | correct the key |
| 31 | `config.precedence` | Which layer supplied each effective key (provenance), shadowed values, contract pins | `specstride config show --sources` logic; doctor prints only differences that matter (shadowed non-default values) | `info`; `warn` when an env var is shadowed by a contract pin | `SPECSTRIDE_LEARNING=apply ignored: contract pins off` | remove the var or re-derive the contract |
| 32 | `config.projectWiden` | Project file sets a widen-class key (R11 T-13, DP-009) | classify keys | `warn` (key ignored) | `specstride.yaml: harnesses.* ignored (user-scope only)` | move it to `~/.config/specstride/config.yaml` |
| 33 | `config.legacy` | Old-format inputs a greenfield product does not read (`.env` at install root, `.specstride/` from the Python tool, `WIGGUM_*`) | `stat`, env names | `info` | `ignored: /…/.env (Python-era)` | none (decision 3) |
| 34 | `secret.inline` | An inline secret in any config layer or argv-visible setting (R11 T-35) | pattern test on key names (`*key*`, `*token*`, `*secret*`, `password`) whose value is not an `env:`/`file:`/`keychain:` reference; plus known token shapes (`sk-`, `ghp_`, `AIza…`) on values. Values are matched in memory and never printed; the finding shows `path:keyname` and a 4-char prefix at most. | `fail` (LB) | `user config: critic.apiKey is inline; use env:` | replace with `env:NAME` |
| 35 | `secret.file` | `file:` reference targets: outside the workspace, mode `0600` (T-35) | `stat` | `fail` if inside the workspace; `warn` if group/world readable | `file:./key inside workspace` | move and `chmod 600` |
| 36 | `secret.envLeak` | Secret-bearing env variables that would be inherited by a child that should not see them (R20: an unknown binary does not inherit the consumer's other provider keys) | compare allowlist per harness | `info` | `children get only their declared credential variables` | none |
| 37 | `run.lock` | Directory lock: owner pid and start time (R2, DP-005) | read the owner file; `kill -0` plus process start time compare (pid reuse) | `info` active; `warn` stale (owner dead), reclaimable at next launch; `fail` if the lock cannot be parsed | `lock held by pid 4242 (alive)` / `stale lock, owner 4242 gone` | `specstride resume` reclaims; or remove `<path>` |
| 38 | `run.stale` | A run marked `running` with no heartbeat/lease, dangling approval record, index-vs-disk divergence (Lisa checks `state.dangling_approval`, `state.index_divergence`) | read state and last event timestamps | `warn` | `run r-17 says running, last event 2h ago` | `specstride status`, then `resume` |
| 39 | `sandbox.level` | Containment level C0–C3 in effect per role and why (R11 R-2, DP-008) | resolved config + adapter capability + `id -u` + container detection (R5: bypass flag refused as root outside a sandbox) | `warn` C0 or C1 by consumer choice; `fail` if a bypass flag is configured but the host would refuse it | `proposer containment C2 (claude Bash sandbox)` / `C0: none, opted in` | see R11 |
| 40 | `sandbox.critic` | Critic has no allow-all flag, no tools | resolved argv | `fail` (LB) | | remove the flag |
| 41 | `ui.endpoint` | `specstride ui` viewer (R13): running or not; bind address; port | read `ui.json` in state (url without token, pid, start time); `kill -0`; confirm bind is loopback | `info` not running; `fail` if bound to a non-loopback address; `warn` if the recorded pid is dead | `ui: http://127.0.0.1:41733 (pid 5150)` / `ui not running` | `specstride ui` |
| 42 | `telemetry.endpoint` | Collector configured, content capture on/off (R14: doctor shows both; warns if dsh's own trace plugin has content on while Specstride's is off) | config; free `GET` when `--online` | `info` never `fail` (Lisa: telemetry never fatal); `warn` if content capture on | `otel http://127.0.0.1:4318 reachable; content capture off` | `telemetry.content: false` |
| 43 | `events.schema` | Reader/writer schema ranges (R14: readers declare the range and the doctor warns) | `specstride.event/1` vs readers | `warn` | `RunView accepts event v1, run wrote v2` | upgrade |
| 44 | `memory.native` | Harness-native memory on for a role (DP-017) | adapter-known setting | `warn` for the critic; `info` for the proposer | `critic: native memory on` | disable |

`LB` checks (the launch preflight): 11, 17, 19, 22, 24, 28 (auto-picked metered critic only), 30, 34, 35, 40. All others never stop a launch.

### F4. Output, exit codes, token budget

**Invocation.** One engine function; three exposures (decision 14): `specstride doctor` (CLI), `/specstride:doctor` (Claude Code skill that runs the CLI and relays), `/specstride-doctor` on dsh (user-only skill, `disable-model-invocation: true`, R4 Q5; dsh has no colon namespace). Flags: `--json`, `--verbose`, `--quick` (skip subprocess and network), `--offline` (no network, subprocess allowed), `--online` (also runs the free metadata `GET`s of R20's metadata pass for roles in use; default when a credential reference exists for a role in use is `on` with a 3 s timeout), `--role <proposer|critic>`, `--harness <id>`, `--strict` (warnings exit 2), `--workdir`. Exit codes:

| Code | Meaning | Note |
|---|---|---|
| 0 | No `fail` findings (warnings and info allowed) | Differs from Lisa (`warn` = 2). Reason: in Wave 1 the same-model warning fires routinely (decision 7), so exit 2 on warn would make the code useless. `--strict` restores Lisa's behaviour. |
| 1 | The doctor itself could not run (bad workdir, crash of the check runner) | Same as Lisa. |
| 2 | At least one `fail` finding | Same number as Lisa's "findings present". Not the engine's exit 2 (`max_rejects`, `orchestrator.sh` per R19 table): the doctor is a separate command, and R19 line 242 leaves the doctor's codes to R16. |
| 3 | Usage error (unknown flag) | Matches the engine's "unknown argument" exit 3 (R19 exit table). |

Timeouts inside a check never raise the exit code above `warn` with message `probe timed out`.

**Human output (default).** Healthy: exactly one line, about 100 bytes:
```
specstride doctor: ok  host=claude-code audience=personal proposer=claude critic=claude(same model, warn) 2 info
```
Warnings print as extra lines after the summary. With `fail` findings: header line, then at most **7** finding lines ordered by severity then id, each `!|x <id>: <message> -> <fix>` truncated at 200 bytes, then a footer `+N more (--verbose); exit 2`. Worst case 7 x 200 + 2 x 150 = 1,700 bytes = about 610 host tokens at 2.8 bytes per token (R17 unit), inside R17's failure-output allowance of 800 tokens; healthy output about 40 tokens against the 600 default. With the resident listing (100) and `SKILL.md` body (800) the worst case is 1,510 tokens, 10 over DP-024's 1,500 (Open question 1: trim the body to 700). `inferred` from R17's table (`R17-context-efficiency-runtime-language.md` lines 350-360).

**`--json`.** Schema id `specstride.doctor/1`, one object, stable key order, no ANSI:
```
{ "schema":"specstride.doctor/1", "at":"<iso>", "host":"claude-code|dsh|cli",
  "audience":"personal|distributed", "exit":0,
  "summary":{"ok":n,"info":n,"warn":n,"fail":n},
  "findings":[{"id":"critic.diversity","severity":"warn","lb":false,"message":"…","fix":"…",
               "evidence":{…redacted…}}],
  "registry":{…R20 resolved registry summary…}, "pick":{…autopick…}, "sources":{…config provenance summary…} }
```
`--json` is not token-budgeted (it is opt-in, decision 16) but never includes a secret value, an account identifier or a token; evidence values pass the single redaction point (Lisa's `redactProfile` pattern). Unknown severities from a newer doctor are treated as `warn` by readers.

### F5. Every as-is configuration layer, placed

Decision 9: flag > env > project `specstride.yaml` > user `~/.config/specstride/config.yaml` > auto-detected default. The table names the rank each as-is layer takes, using this **extended order** (new entries in bold):

`contract pin (only pinnable keys, F5.4)` > flag > **run snapshot on resume only (F5.2)** > env > project `specstride.yaml` > user config > **learned value (only under `learning.mode: apply`, per-knob and per-phase, F5.6)** > auto-detected / built-in default.

Learned value sits below the user config for general keys only in the sense of "replaces the general default"; for per-phase timeouts it beats general settings but not per-phase explicit settings (F5.6). Placement of each layer:

| # | As-is layer | Where it is (evidence) | What it does today | Placement |
|---|---|---|---|---|
| 5.1 | Built-in defaults | `SS orchestrator.sh:202-231` (`${SPECSTRIDE_X:-default}`), `proposer.sh` (`:=` defaults, e.g. `SPECSTRIDE_YIELD_POLL` 30) | Defaults are read from the environment after `.env` was sourced, so "default" and "env" are one expression | **Same rank**: auto-detected/built-in default, lowest. Provenance (`default`) is recorded per key. |
| 5.2 | Install-root `.env` | `SS orchestrator.sh:177-194`, `specstride:126-135` (reverse); `SS .env.example` | Sourced as **shell code** (`set -a; . .env`), then the caller's exported variables are re-asserted (`eval "$_caller_env"`), so `.env` fills only unset variables. The help text says "defaults < .env < these flags" and omits caller env; the code order is defaults < `.env` < caller env < flags (`R19` row 6) | **Divergence, dropped.** An install root is not writable or meaningful for an npm install, and sourcing a file as code is a hazard (R11 T-13 class). Its role (a machine-wide default beaten by the caller's environment) is exactly the **user config**, which sits below env. The `.env.example` knob list becomes the config schema (F6). No loader for `.env` files (decision 3), except a project/user `env_file` key is **not** offered. Row: `DR-cfg-01`. Also drops the `WIGGUM_*` mapping (`SS lib/specstride_env.py`, decision 3). Inline secrets that `.env` allowed (`SS .env.example` has key variables) become config errors (check `secret.inline`). |
| 5.3 | Caller environment | `SS orchestrator.sh:187-194` | Beats `.env` and defaults, loses to flags | **Same rank** (env), with a fixed naming rule and an alias table (F6) so the parity oracle can drive both implementations with the same variables. |
| 5.4 | Flags | `SS orchestrator.sh:233-262` (last flag wins; `--proposer-timeout-phase` repeats) | Highest for a fresh launch | **Same rank.** Last-wins retained. A generic `--set <path>=<value>` (repeatable) reaches every schema key (evolvability: a new key needs no new flag). |
| 5.5 | Replayed `last-run.conf` | Written `SS orchestrator.sh:640-685` (both `<feature>/last-run.conf` and the root pointer, failure ignored `:683`, R19 D-22); read `SS specstride:577-628` | `resume` sources the conf and turns the saved values into **flags** (`--proposer-timeout` at `:611`, others nearby), then appends the user's extra args (last wins, `:627`). Result: saved values beat the caller's environment. Env-only settings (critic timeout, wall budget, MALFORMED limit, diagnostician and accelerator switches, learning mode) are **not** saved (R19 D-23); only `GIT_COMMITS` is re-exported (`:624`). | **New layer: the run snapshot** (`<run>/config.resolved.json`, provenance per key, written before the first pass; a failed write is a launch error, not ignored: divergence row `DR-cfg-02`). On resume it ranks **below flag, above env** for keys classed `pinned` (harness, model, critic pick, spec format, feature, verification plan, containment level, audience), because that is what the code does today for those keys and what decision 23 needs (counts and identity survive). For keys classed `tunable` (timeouts, caps, budgets, poll intervals, telemetry endpoints) it ranks **below env**, so the remediation text the engine prints today (`SPECSTRIDE_PROPOSER_TIMEOUT=3600 specstride resume`, `SS orchestrator.sh:1916, 1962`) works. |
| 5.5a | Latent defect | `SS orchestrator.sh:183` comment and `:1916, :1962` remediation text vs `SS specstride:611` | The remediation says an exported `SPECSTRIDE_PROPOSER_TIMEOUT` wins on resume. But `PROPOSER_TIMEOUT` is now always saved (`orchestrator.sh:650-654` comment says it "was never persisted at all until now") and re-passed as a flag, so the exported value is silently overridden. `inferred` from reading both files; not executed. | **Do not port.** Fixed by the pinned/tunable split above. If R18/R21 confirm it, it is a divergence-register row (the oracle would otherwise pin the defect). |
| 5.6 | Learned decisions | `SS orchestrator.sh:1642-1690` (`resolve_proposer_timeout`, `resolve_yield_poll`); `SS lib/learn.py:1314-1330` | Per-phase timeout: (1) `--proposer-timeout-phase`/`SPECSTRIDE_PROPOSER_TIMEOUT_PHASE_<N>`; then, if `SPECSTRIDE_LEARNING=apply` and a bound decision exists, the **learned** value; then `phaseTimeouts` declared in the verification-commands document; then the global timeout. The comment calls the learned value "1.5" but the code applies it before the declared and global values, so it beats a global `--proposer-timeout` flag. | **Recorded divergence from the strict order** (`DR-cfg-03`): the learned value ranks under per-phase explicit settings (flag/env/project/user per-phase) and above the verification document's `phaseTimeouts` and above every non-per-phase value. It is gated by `learning.mode: apply`, which is contract-pinned (F5.7). Provenance `learned` is recorded per value, as today (the `proposer_cap` event carries the source). Kept under the oracle. |
| 5.7 | The launch contract's own configuration | `MOL references/contract.md` `configuration.auto` (`max_relaunches` 0-5, default 2; `wall_clock_seconds`) and `configuration.learning` (`mode`, `decisions_through`, `decisions_sha256`, `effective`, `source_path`); `MOL validate_contract.py` | `configuration.auto` is supervision policy "derived from the contract, never chosen by the model at run time"; `configuration.learning` binds the decision log prefix that a run may act on. | Not config in the F6 sense: they are **derived artifacts** that live in the contract and are validated. Placement: `supervise.maxRelaunches` and `supervise.wallClockSeconds` exist in the schema as **ceilings** (user scope; project may lower). The contract's derived values must lie within them, else validation fails (like today's check that the wall ceiling may not exceed what the stages declare). Contract values are shown by `config.precedence` as source `contract`. |
| 5.8 | The one place the contract beats the environment | `MOL runtime.py:112-125` (`resolve_env`): strips `SPECSTRIDE_LEARNING` (and the legacy name) from every child's environment; for a `specstride` stage sets it to `off` explicitly unless the stage's `env` declares it (unset would let Specstride's own `.env` re-assert a value); `SS lib/learn.py:1325` acts only on `== "apply"`. | An operator's exported `SPECSTRIDE_LEARNING=apply` never reaches a supervised run. | **Kept, generalised as a rule**: keys marked `pin: contract` in the schema (`learning.mode`, `learning.through`, `output.live` when the run is non-interactive) take the contract's value and **the shell value is stripped**. This is the only rank above flags, it applies to run children only (a manual `specstride run` on the shell is not a contract run), and the doctor reports a shadowed env value (`config.precedence`). A second, smaller instance: `MOL runtime.py:320-336` forces `SPECSTRIDE_LIVE=false` and `--no-live` in never-colour mode; it is placed under the same rule (`output.live`). |
| 5.9 | Spec-format and feature environment step | `SS orchestrator.sh:223-224` (`SPECSTRIDE_SPEC_FORMAT`, `SPECSTRIDE_FEATURE`), R19 C-07 | An environment variable feeds format detection | Becomes config keys `spec.format` and `spec.feature`; auto-detection is the default layer. |
| 5.10 | Per-backend variables | `SS .env.example` (`SPECSTRIDE_DSH_MODEL`, `_CLAUDE_PROPOSER_MODEL`, `_CLAUDE_CRITIC_MODEL`, `_CODEX_*_MODEL`, `_DSH_PROFILE`, `_PRIME_AGENT_BIN`, overlay switches) | Model and binary selection encoded in the variable name per backend and role | Become `roles.<role>.harness`, `roles.<role>.model`, and `harnesses.<id>.{bin,profile,args,overlay}` (R20 descriptor `detect.binary`, R20 overlay reuse). The names survive only as **aliases** in the oracle's env alias table (F6). |
| 5.11 | Lisa's configuration | `LISA doctor.ts` reads `LISA_PROPOSER`, `LISA_CRITIC`, `ANTHROPIC_*`; `LISA .env.example` | Process environment only; no file layers; `LISA_PROPOSER=provider/model,provider/model` is a chain with fallback order | **Dropped as a layer.** Two ideas kept: the provider chain becomes `roles.<role>.fallback` (R14) and per-attempt/per-job USD budgets become `budget.*` keys. `LISA_*` names are not read (decision 3; the product is not a Lisa consumer, DP-014). |
| 5.12 | `MOL bin/onboard-skill --check` | `MOL bin/onboard-skill` (`--check` verifies the expected symlink without changing the filesystem; exit 5 missing link, 6 collision) | Nearest thing to a doctor in mixture-of-loops | Its checks become plugin-install checks in `host.*`; the symlink mechanism is replaced by plugin packaging (R2 row, R3). |

**F5.13. Summary of divergences and rows the register needs.**

| Row | Change | Under the oracle |
|---|---|---|
| `DR-cfg-01` | Install-root `.env` not read; user config replaces it; inline secrets refused | Oracle sets variables in the process environment, so no `.env` file is needed |
| `DR-cfg-02` | Resume uses a snapshot with a pinned/tunable split; failed snapshot write is an error | Oracle compares replayed values, which match for pinned keys; the tunable/env case differs from the as-is defect (5.5a) |
| `DR-cfg-03` | Learned value placement recorded (kept as-is) | Same as today |
| `DR-cfg-04` | Contract pin rule generalised beyond `SPECSTRIDE_LEARNING` | Off in oracle (only `learning.mode` and `output.live` are pinnable, both as today) |
| `DR-cfg-05` | Default proposer/critic change (today `dsh`/`claude`, `SS orchestrator.sh:202-203`; Wave 1 default is Claude/Claude) | Oracle passes explicit values; this is the known tension in the prompt, not new |

### F6. The full config schema

**Files.** User: `~/.config/specstride/config.yaml` (honours `XDG_CONFIG_HOME`; macOS uses the same path for one documented location, `inferred`). Project: `<workdir>/specstride.yaml`. Both are YAML validated against JSON Schema id `specstride.config/1` (`schema: 1` at top; unknown key is an error; unknown `x-*` keys are ignored, as in R20's descriptor rule; the schema is shipped in the package and printed by `specstride config schema`). Descriptor files stay in `~/.config/specstride/harnesses/*.yaml` (R20 S7).

**Scope flags.** F = flag, E = env, P = project, U = user. **Trust class** (R11 T-13): `W` widen (P ignored, with warning `config.projectWiden`); `N` narrow (P accepted only if it is stricter than the value from lower layers: lower cap, fewer phases, stricter mode, micro-loops off); `-` neutral (P accepted freely). A `pin` marks contract-pinnable keys (F5.8).

**Naming rule.** Environment name = `SPECSTRIDE_` + the dotted path with `.` replaced by `_` and camelCase split to `UPPER_SNAKE`. Where the as-is name exists (all of `SS .env.example`), the as-is name is kept and listed as the primary name so that the oracle can drive both implementations with the same variables. Flag rule: `--set <path>=<value>` for every key; short flags only for the as-is ones.

| Key | Type | Default | Scope | Trust | Env / flag | Notes |
|---|---|---|---|---|---|---|
| `schema` | int | 1 | P U | - | | Config schema version |
| **Identity and distribution** | | | | | | |
| `distribution.audience` | `personal` \| `distributed` | `distributed` | U E F | W | `SPECSTRIDE_AUDIENCE`, `--audience` | Selects the terms gate audience (R8v). Default is the safe one; the owner sets `personal` once. New default, see Open question 2. |
| `distribution.termsOverride` | list of `{provider,tier,ack}` | `[]` | U | W | | Consumer acknowledgement of a personal-use-only path in the distributed audience (DP-042); every use is warned and recorded. Never lifts a `refused` row (Tier 3, unknown provider prohibited). |
| **Roles** (decision 9: per-phase overrides for proposer and critic) | | | | | | |
| `roles.proposer.harness` | string id | auto-detected (Wave 1: `claude`) | F E P U | - | `SPECSTRIDE_PROPOSER`, `--proposer` | Any registry id (decision 17). Discovery never changes it. |
| `roles.proposer.model` | string | harness default | F E P U | - | `SPECSTRIDE_<HARNESS>_PROPOSER_MODEL` (alias), `--set` | |
| `roles.proposer.effort` | string | harness default | F E P U | - | `SPECSTRIDE_DSH_REASONING_EFFORT` (alias) | reasoning effort/thinking level |
| `roles.proposer.tier` | 1 \| 2 | `1` personal, `2` distributed | F E U | W | `SPECSTRIDE_PROPOSER_TIER` | Tier 3 is not a valid value (refused; DP-020) |
| `roles.proposer.credential` | `env:NAME` \| `file:PATH` \| `keychain:SVC/ACCT` | none | F E U | W | | Inline value is an error (`secret.inline`) |
| `roles.proposer.timeoutSec` | int | 1800 | F E P U | N | `SPECSTRIDE_PROPOSER_TIMEOUT`, `--proposer-timeout` | `SS orchestrator.sh:214` |
| `roles.proposer.idleTimeoutSec` | int | 900 | F E P U | N | `SPECSTRIDE_PROPOSER_IDLE_TIMEOUT` | `.env.example` |
| `roles.proposer.progressTimeoutSec` | int | 1800 | F E P U | N | `SPECSTRIDE_PROPOSER_PROGRESS_TIMEOUT` | |
| `roles.proposer.repeatLimit` | int | 12 | F E P U | N | `SPECSTRIDE_PROPOSER_REPEAT_LIMIT` | repeat-stall watchdog (exempt at micro-loop check ends, decision 21) |
| `roles.proposer.maxErrors` | int | 2 | F E P U | N | `SPECSTRIDE_PROPOSER_MAX_ERRORS` | consecutive errors |
| `roles.proposer.maxCaps` | int | 3 | F E P U | N | `SPECSTRIDE_PROPOSER_MAX_CAPS` | |
| `roles.proposer.fallback` | list of `{harness,model?,auth?}` | `[]` (off) | F E U | W | | R14: opt-in per role; widens capability |
| `roles.critic.harness` | string id | auto (order of decision 17) | F E U | W | `SPECSTRIDE_CRITIC`, `--critic` | Critic selection is user-scope (R11 T-13; DP-009's text is narrower, see Open question 3) |
| `roles.critic.model` | string | harness default, different tier from proposer | F E U | W | `SPECSTRIDE_<HARNESS>_CRITIC_MODEL` | |
| `roles.critic.tier`, `.credential`, `.fallback` | as proposer | | F E U | W | | |
| `roles.critic.timeoutSec` | int | 300 | F E P U | N | `SPECSTRIDE_CRITIC_TIMEOUT`, `--critic-timeout` | |
| `roles.critic.malformedLimit` | int (0 disables) | 3 | F E P U | N | `SPECSTRIDE_CRITIC_MALFORMED_LIMIT` | |
| `roles.critic.grounding` | bool | true | F E P U | N | `SPECSTRIDE_CRITIC_GROUNDING` | |
| `roles.critic.contextTokens` | int | harness window | F E U | W | `SPECSTRIDE_CRITIC_CONTEXT_TOKENS` | override declared window (R9 F18) |
| `critic.autoPick` | bool | true | F E U | W | `SPECSTRIDE_CRITIC_AUTOPICK`, `--no-critic-autopick` | Names proposed by R20; fixed here. Off skips rungs 2 and 3. |
| `critic.autoPickMaxUsd` | number | required when metered | F E U | W | `SPECSTRIDE_CRITIC_AUTOPICK_MAX_USD` | DP-025 hard cap |
| `critic.warnSameModel` | bool | true | F E U | - | | Warning only; decision 7 says it never blocks; off only silences the line, never the event |
| `roles.diagnostician.*`, `roles.accelerator.*` | `enabled` bool (default true), `harness`, `model` | as-is | F E P U | N | `SPECSTRIDE_DIAGNOSTICIAN`, `SPECSTRIDE_ACCELERATOR`, `SPECSTRIDE_ACCELERATOR_BACKEND` | `.env.example` |
| **Per-phase overrides** | | | | | | |
| `phases.<N>.proposer.{harness,model,effort,timeoutSec,idleTimeoutSec}` | as role keys | inherits the role | F E P U | as the role key | `SPECSTRIDE_PROPOSER_TIMEOUT_PHASE_<N>`, `--proposer-timeout-phase N=SEC` (repeatable), else `--set phases.3.proposer.model=X` | `<N>` = Spec Kit phase number as string; also accepted: phase slug. First per-phase hit wins (F5.6). |
| `phases.<N>.critic.{harness,model,timeoutSec}` | as role keys | inherits | F E U (P for narrowing keys only) | as the role key | `--set` | A per-phase `critic.harness` is `W` |
| `phases.<N>.budget.*` | as `budget.*` | inherits | F E P U | N | | |
| **Loop** | | | | | | |
| `loop.maxRejects` | int | 3 | F E P U | N | `SPECSTRIDE_MAX_REJECTS`, `--max-rejects` | |
| `loop.maxIter` | int | 30 | F E P U | N | `SPECSTRIDE_MAX_ITER`, `--max-iter` | |
| `loop.maxWallMin` | int (0 off) | 0 | F E P U | N | `SPECSTRIDE_MAX_WALL_MIN` | |
| `loop.oscMax` | int | 2 | F E P U | N | `SPECSTRIDE_OSC_MAX` | oscillation |
| `loop.yield.{pollSec,maxPerAttempt,countsAsIter,allowCommand}` | 30, 4, false, false | | F E P U | N (`allowCommand` W) | `SPECSTRIDE_YIELD_*` | |
| `loop.promptMaxBytes` | int | 180000 | F E P U | N | `SPECSTRIDE_PROMPT_MAX_BYTES` | |
| `loop.gitCommits` | `auto`\|`on`\|`off` | auto | F E P U | - | `SPECSTRIDE_GIT_COMMITS` | env-only today; reverse forces off (`SS specstride:176`) |
| `loop.strategy` | `micro`\|`classic` | `micro` (Wave 1, decision 21) | F E P U | N (P may select `classic`) | `SPECSTRIDE_LOOP_STRATEGY` | recorded per run |
| `loop.microLoops.*` | caps and check set | R22-R26 | F E P U | N | | R23/R27 own the contents; R16 reserves the namespace |
| `session.continue` | bool | true where supported | F E P U | - | | decision 22; off under the oracle |
| `resume.resetCounts` | bool | false | F | - | `--reset-counts` | decision 23; flag only, one-shot, never persisted |
| **Spec and verification** | | | | | | |
| `spec.format` | string | auto-detect | F E P U | - | `SPECSTRIDE_SPEC_FORMAT`, `--spec-format` | |
| `spec.feature` | string | last active | F E P | - | `SPECSTRIDE_FEATURE`, `--feature` | |
| `verification.mode` | `required`\|`plan`\|`off` | `required` | F E P U | N | `SPECSTRIDE_VERIFICATION`, `--verification` | |
| `verification.testPlan`, `.commands`, `.generateTests` | string/path | none | F E P | W (`commands` run code) | `SPECSTRIDE_TEST_PLAN`, `..._VERIFICATION_COMMANDS`, `..._GENERATE_TESTS` | `commands` is a code-executing key: user, env and flag only |
| `verification.longJob.{phase,cmd}` | int, string | none | F E | W | `SPECSTRIDE_LONG_JOB_PHASE`, `_CMD` | |
| **Harness declarations and discovery** (R20) | | | | | | |
| `harnesses.<id>` | descriptor (R20 schema; not defined here) | none | U F | W | | Project scope ignored (DP-009) |
| `discovery.enabled` | bool | true | F E U | - | | Passive pass always safe |
| `discovery.online` | bool | true when a credential reference exists | F E U | - | | Metadata GETs only |
| **Budgets and quota** (R14 owns semantics) | | | | | | |
| `budget.run.costUsd`, `budget.role.<r>.costUsd`, `.tokens` | number | none (API-key roles must set one for auto-picked metered critic) | F E U; P lower only | N | `SPECSTRIDE_BUDGET_*` | Hard caps for API-key spend |
| `budget.role.<r>.softTokens` | int per window | none | F E P U | N | | Subscription alert only |
| `budget.alertThresholds` | list of pct | `[50,75,90]` | F E U | - | | |
| `pause.maxTotalMs` | int | 43200000 (12 h) | F E U | W | | R14 proposed default |
| `fallback.after` | duration | 0 | F E U | W | | |
| **Safety** | | | | | | |
| `sandbox.level` | `C0`..`C3` \| `auto` | `auto` (C2 if offered, else C1) | F E U | W | `SPECSTRIDE_SANDBOX` | DP-008; C0 needs explicit opt-in |
| `sandbox.permissionMode` | string | `acceptEdits` (Claude) | F E U | W | | DP-011 |
| `memory.native.proposer` | bool | false | F E U | W | | DP-017; critic is always off |
| **Observability** (R14) | | | | | | |
| `telemetry.enabled`, `telemetry.lokiUrl` | bool, url | false, none | F E U | W (urls) | `SPECSTRIDE_TELEMETRY_ENABLED`, `SPECSTRIDE_LOKI_URL`, `--telemetry`, `--loki-url` | |
| `telemetry.otel.enabled`, `.url` | bool, url | false, none | F E U | W | `SPECSTRIDE_OTEL_ENABLED`, `SPECSTRIDE_OTEL_URL`, `--otel`, `--otel-url` | |
| `telemetry.content` | bool | false | F E U | W | `SPECSTRIDE_TELEMETRY_CONTENT` | DP-029 |
| **Output** | | | | | | |
| `output.live` | `auto`\|`true`\|`false` | `auto` | F E P U | `pin` | `SPECSTRIDE_LIVE`, `--live/--no-live` | |
| `output.verbose` | bool | false | F E | - | `SPECSTRIDE_VERBOSE`, `--verbose` | decision 16 |
| `output.liveDetail` | string | `tools` | F E P U | - | `SPECSTRIDE_LIVE_DETAIL` | |
| **Supervision** (from the contract, F5.7) | | | | | | |
| `supervise.maxRelaunches` | int 0..5 | 2 | F E U; P lower only | N | | ceiling for the contract's derived value |
| `supervise.wallClockSeconds` | int | derived | F E U; P lower only | N | | ceiling |
| **Learning** | | | | | | |
| `learning.mode` | `off`\|`suggest`\|`apply` | `off` | F E U | `pin` W | `SPECSTRIDE_LEARNING` | contract beats the shell (F5.8) |
| `learning.through` | run id | none | contract only | `pin` | `SPECSTRIDE_LEARNING_THROUGH` | |
| **UI and doctor** | | | | | | |
| `ui.port` | int | random free port | F E U | - | | bind is always loopback; not configurable (R13) |
| `doctor.staleAfterDays` | int | 90 | F E U | - | | version-pin `verified-on` staleness |
| `doctor.online` | bool | true | F E U | - | | |
| `state.dir` | path | `<workdir>/.specstride` | F E U | W | `SPECSTRIDE_STATE_DIR` | |
| **Reverse** | | | | | | |
| `reverse.maxFileBytes`, `.maxTotalBytes`, `.tasks` | 1048576, 20971520, `done` | | F E P U | N | `SPECSTRIDE_REVERSE_*` | `SS .env.example` |

The Claude Code plugin's `userConfig` (R3 F1) exposes only non-secret convenience keys (`distribution.audience`, `roles.*.harness`) as `CLAUDE_PLUGIN_OPTION_*`, which the CLI reads as **flag-level** input from the shim; a `sensitive` userConfig value is passed as an `env:` reference target, never inline in a file. `inferred` from R3 and R3v P31.

### F7. Precedence resolution algorithm (for architecture.md)

1. Load: built-in defaults; auto-detection; user file; project file (with trust filter: `W` keys removed, `N` keys dropped if they widen, one `config.projectWiden` finding each); env; snapshot (resume only); flags; contract pins.
2. Merge per key with the order of F5. Lists (`fallback`, `harnesses`) replace, never concatenate, except `harnesses` which merge by id with the precedence "consumer-declared, tested adapter, bundled descriptor, auto-detected" (R20 line 50).
3. Validate the merged result strictly; unknown keys and inline secrets are errors.
4. Write `<run>/config.resolved.json`: value, source layer, and (for `learned`) the decision id. Secret references are stored as references. This is the file `resume`, the digest, `RunView` and `doctor` all read (decision 11's single source).
5. Events: `config.resolved{schema,hash}` at launch; `config.overridden{key,from,to,layer}` on a tunable override at resume.

### F8. Lock and other state facts the doctor depends on

R2 F-9 and DP-005: the default is an atomic directory lock recording owner pid and start time with stale-owner reclaim (`verified-local`: Lisa and Specstride's own fallback do the same, `SS orchestrator.sh:515-520`, `LISA packages/cli/src/layout.ts:16-19, 228`). R11 T-27 recommends the opposite (kernel advisory lock only, "no directory-based fallback"). **Conflict**: R11 was written without DP-005's finding that Node has no `flock` and native modules break plain npm install. `run.lock` follows DP-005; if the owner rules for a kernel lock, only check 37's method changes.

## Version/date pins

The doctor's `harness.version.<id>` data (each row is the adapter's declared range and `verified-on`, taken from the finished reports; the doctor warns outside the range, decision 10). All `verified-on` dates below are the reports' dates, not re-verified here.

| Harness or tool | Range | verified-on | Source |
|---|---|---|---|
| Claude Code CLI | tested 2.1.284; floor 2.1.259 (2.1.248 with `--restricted`; 2.1.271 for `userConfig.options`) | 2026-09-29 | R5, R3v |
| `@anthropic-ai/claude-agent-sdk` | 0.3.284 | 2026-09-29 | R5 |
| Codex CLI | `>=0.153.4 <0.154` | 2026-09-29 | R6 |
| Gemini CLI | `>=0.61.0 <0.62.0` (docs only) | 2026-09-29 | R7 |
| Copilot CLI | `>=1.0.89 <1.1.0` (docs only) | 2026-09-29 | R7 |
| pi | `>=0.80.6 <0.81` | 2026-09-29 | R9 |
| prime-agent | `>=0.7.3 <0.8` (stream schema 3) | 2026-09-29 | R9 |
| dsh | `==0.1.0-rc.8` (R9) versus `>=0.1.0-rc.8 <0.1.0` (R4). The R4 range is malformed (an upper bound below the lower bound). The doctor follows R9's exact pin. | 2026-09-29 | R4, R9 |
| opencode | `opencode-ai >=1.18.32 <1.19`; warn on 2.x | 2026-09-29 (live 2026-09-26) | R10 |
| Node | engines `>=22` proposed (22 is the LTS installed here; 18 and 20 are end-of-life or near it as of this date, `unverified`: recalled schedule, not fetched) | 2026-09-29 (local 22.23.2) | this report |
| Managed settings paths | `/etc/claude-code/` (Linux, WSL); `/Library/Application Support/ClaudeCode/` (macOS); `C:\Program Files\ClaudeCode\` (Windows) | 2026-09-29 | `verified-doc` https://code.claude.com/docs/en/managed-settings, accessed 2026-09-29 |
| Claude Code settings precedence | managed > command line > local > project > user | 2026-09-29 | `verified-doc` https://code.claude.com/docs/en/settings, accessed 2026-09-29 |
| Local: `/etc/claude-code` | absent on this machine | 2026-09-29 | `verified-local` (`ls`) |
| Doctor JSON schema | `specstride.doctor/1` (proposed) | this report | |
| Config schema | `specstride.config/1` (proposed) | this report | |

## Options compared

**Choice A: how `resume` treats saved config.**

| Criterion | A1. Port as-is (saved values become flags) | A2. Re-resolve everything from current layers | A3. Snapshot with pinned/tunable split (recommended) |
|---|---|---|---|
| Matches today's behaviour | yes | no | for pinned keys yes; fixes tunables |
| Documented remediation works (`SPECSTRIDE_PROPOSER_TIMEOUT=… resume`) | no (latent defect 5.5a) | yes | yes |
| Run identity stable across resume (decision 23) | yes | no (a shell variable can switch the critic) | yes |
| Oracle cost | none | many rows | one row |
| Complexity | lowest | low | medium (one classification per key, in the schema) |

**Choice B: doctor exit codes.**

| Criterion | B1. Lisa's (warn = 2) | B2. warn = 0, fail = 2 (recommended) | B3. Bitmask |
|---|---|---|---|
| Useful when the same-model warning is routine | no | yes | yes |
| Simple for hooks and scripts | yes | yes | no |
| Compatible with `--strict` | n/a | yes | n/a |

**Choice C: where `.env` goes.** Keep an `.env` loader (rejected: shell-code execution, secrets at rest, no install root under npm), drop it and use user config (recommended), or load a project `.env` (rejected: widen path, R11 T-13).

## Recommendation

1. **Adopt the extended order of F5** (contract pin > flag > snapshot [resume] > env > project > user > learned > default) with the trust classes of F6. Confidence: high on the placement of `.env` (dropped into user config), flags, env, the pin rule; medium-high on the snapshot split, which resolves a real defect but rests on reading, not on running, the code.
2. **Ship the doctor as one engine function** with the 44 checks of F3, the finding model of Lisa, a read-only contract, `--json` `specstride.doctor/1`, and exit codes `0/1/2/3` with `warn` = 0. Confidence: high on the model and read-only contract; medium on the token numbers (the worst case is 10 tokens over the 1,500 budget, Open question 1).
3. **Defer `--fix`.** Wave 1 doctor prints fixes and changes nothing. Confidence: high (it is what "changes no state" requires); low cost.
4. **The launch preflight is a subset of the doctor** (`LB` checks), so the doctor and the engine cannot disagree about what blocks a run. The critic-diversity warning is deliberately outside that subset.
5. **Config schema id and env naming** as in F6, keeping as-is env names so the oracle can drive both implementations with the same variables, and a generic `--set` flag for evolvability.
6. **Default audience `distributed`** in the shipped package, `personal` set by the owner in user config once. Confidence: medium; see Open question 2.

## Matrix rows

Harness Capability Matrix: none (R16 contributes no harness row). The doctor adds the following columns' worth of *data* that the matrix rows of R5–R10 and R20 must supply, so that check 14 and 17 work: `detect/version command`, `version pin + verified-on`, an `auth probe` argv (Claude: `claude auth status`; Codex: `codex login status`; others: none known, `unprobed`), a `list-models` argv or `modelsPath`, and `toolless: structural|configured|no`.

Host Capability Matrix: doctor exposure only (from R4 Q5 and R3):

| host | skills | hooks | background processes | UI surfaces | packaging | evals |
|---|---|---|---|---|---|---|
| Claude Code | `/specstride:doctor` skill runs `specstride doctor` and relays; listing about 100 tokens | `SessionStart` may show open doctor `fail` count in one line (optional, R3) | n/a (doctor is foreground) | terminal text | plugin ships the skill; CLI is the engine | trigger eval must show the doctor skill fires on "is Specstride set up" and stays quiet otherwise |
| dsh | `specstride-doctor`, user-only (`disable-model-invocation: true`), zero resident tokens | none (DP-003) | n/a | terminal | skill installed by the npm package | DP-002 |
| CLI | `specstride doctor` | n/a | n/a | terminal | npm bin | unit-tested with injected probes (Lisa's SC-024 pattern) |

## Open questions / risks

1. **Doctor token budget is 10 tokens over on the worst case** (100 resident + 800 body + 610 failure output = 1,510 against DP-024's 1,500). Default: 7-line cap as designed and a 700-token body. Ask R17 to confirm the arithmetic when it freezes the numbers.
2. **Default audience.** The gate has two audiences (R8v, DP-042). Shipping `distributed` as the default is the conservative reading of decision 19 (built for the owner first, public later) but forces the owner to set `personal` on every machine. If the owner wants `personal` by default, the published package must set the opposite at install. Candidate `DECISIONS-PENDING` item.
3. **DP-009 wording is narrower than R11 T-13.** DP-009 lists "harness declarations, endpoints and secret references"; T-13 also lists the critic selection, sandbox level, permission flags, budget increases, hook commands, telemetry endpoints and content capture. The schema follows T-13 (the stricter one). Confirm at the stop.
4. **Latent defect 5.5a** (resume overrides an exported timeout, contradicting the engine's own remediation text) is inferred from reading `SS specstride:611` and `orchestrator.sh:1916`; nobody ran it. R18/R21 should confirm; if confirmed it is a defect fixed with a register row.
5. **Keychain presence check on Linux** has no non-printing query identified. Until a spike finds one, `auth` and `secret` checks report `unprobed` for Linux keychain references.
6. **`claude auth status` and `codex login status`** are assumed to change nothing and make no paid call (help text only; not executed to avoid touching credentials). Verify in the adapter's conformance run.
7. **Node floor.** `>=22` is proposed from the machine's Node and recalled release schedules; the SDK's own engine floor is 18 (R5). The end-of-life dates were not fetched. Verify against the Node release page before freezing `engines`.
8. **R11 T-27 versus DP-005** on the lock type (F8). The doctor follows DP-005.
9. **Doctor and project config.** Reading a cloned project's `specstride.yaml` for diagnosis executes nothing, but the file is untrusted input (R11): the parser must be a safe YAML load (no custom tags, size cap), tested with hostile fixtures.
10. **The per-key `pinned`/`tunable` classification** is one more attribute in every key's schema entry. It must be reviewed key by key by R18/R19 at the disposition stage, since it decides which resume behaviours the oracle sees.
11. **`--online` default.** The doctor sends a credential to a models endpoint by default when a role uses one (DP-026 permits GET only). If the owner rules DP-026 the other way, `model.reach` becomes `unprobed` for keyed endpoints and the default flips to `--offline`.
