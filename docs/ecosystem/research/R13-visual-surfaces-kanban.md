# R13 — Visual surfaces and the kanban

Access date for every `verified-doc` and `verified-local` item: 2026-09-29. `LISA-MAIN` = `git show 363e6a3:<path>` in `/root/lisa`; `LISA-BASE` = `git show 76adfdc:<path>`. Nothing in `/root/lisa` was modified; scratch copies are under `/tmp/specstride-research/R13/`.

## Prior art consulted

| Source | Used for | Reuse / extend / contradict |
|---|---|---|
| `BRIEF-COMMON.md`, `prompts/specstride-ecosystem.md` §0-§2 and §4 row R13 | scope, decisions 11, 13, 16, 19 | binding |
| `.specify/memory/constitution.md:103-118` (Principle I) | fit test for every surface | applied per surface |
| `docs/ecosystem/research/R4-dsh-host.md` (Q3, F13, F18, matrix row) | dsh render surfaces, event log, loopback fence | reused, not re-derived; extended with the client-module facts below |
| `docs/ecosystem/research/R3-claude-code-host.md` (hooks, monitors, status line, `--bg`) | Claude Code plugin mechanics | reused; R3 defers "artifacts and UI" to this report |
| `prompts/analysis/A4-claude-code-host-facts.md` "UI surfaces" | leads | Artifacts confirmed; "MCP UI resources and IDE webviews: unverified" is now resolved (both unavailable, see Q1) |
| `/root/lisa/packages/web/src/App.tsx` at `363e6a3` and `76adfdc` | the two view-model builders | byte-identical between the refs (`cmp` exit 0) |
| `/root/lisa/packages/{dashboard,server,tui,web}` at both refs | candidates | see Q3 |
| `old/028-as-is-specstride/contracts/events.md`; `/root/specstride/lib/present.py` | today's Specstride event stream and terminal follower | source of the event needs in Q4 |

Contradicted from the brief: the assignment says `App.tsx` defines the builders that "the kanban" uses. In fact the builders are used by nothing that runs (Finding F3). The running Lisa dashboard is a different package.

## Questions answered

**Q1. What can show the kanban and run state from inside a Claude Code plugin, and what does each cost?** Seven candidate surfaces exist. Two are not available, one is only a static export, and four work. Details and the comparison table are under Findings and Options compared. The short verdict:

| Surface | Available in Claude Code? |
|---|---|
| Local web server the plugin opens | Yes, but as a process the user starts (not a plugin component); Principle I needs an amendment note |
| Artifact page fed from exported state | Yes, static snapshot or connector-backed; needs a claude.ai login on the Anthropic API; cannot reach local files after publish |
| MCP UI resources (MCP Apps, `ui://`) | No. Claude Code does not render them (issue open since 2026-09-17) |
| IDE webviews | No plugin-level API found. The VS Code extension is a closed panel |
| TUI | Yes, as `specstride watch` in a second terminal or pane; it cannot render inside the Claude Code session |
| Status line | Only the user's own `statusLine`; a plugin ships `subagentStatusLine` only |
| Monitor notifications | Yes (interactive sessions only), but this is text pushed to the model, not a display |

**Q2. What can dsh render?** A browser client (the `web` profile) with plugin-contributed client bundles, slash-command text, and tool-result cards. No TUI and no status line are installed (R4 F18). A local viewer opened in any browser works on dsh unchanged, so the same `specstride ui` serves both hosts.

**Q3. Are Lisa's server and tui packages candidates?** Not as they stand. Reasons under F6-F9. Small pure pieces are worth porting or reimplementing (F4, F9). Whether the packages are reused at all is R1's ruling.

**Q4. What is the renderer-independent UI data contract?** A pure reducer `reduce(state, event) -> state` and a canonical snapshot type `RunView` (schema id `specstride.view/1`), derived only from the single event schema (decision 11) and the run's state files. Specified in full below in "The UI data contract". Every renderer, the doctor's run section, `specstride status`, hooks and the status line consume `RunView` and nothing else.

**Q5. One recommendation for Wave 1 and Wave 2?** Wave 1: contract only, plus a text renderer that is the contract's first consumer. Wave 2: one on-demand read-only local web viewer (`specstride ui`, both hosts) and a terminal follower (`specstride watch`). Artifact export as a static snapshot command. No MCP UI, no IDE panel, no dsh client bundle. See Recommendation.

## Findings

### A. Claude Code surfaces

| # | Claim | Tag | Evidence |
|---|---|---|---|
| F1 | A plugin can declare: skills, commands, agents, hooks, MCP servers, LSP servers, output styles, workflows, themes, monitors, `bin/`, and `settings.json`. None of these is a UI panel, page or webview component. | verified-doc | https://code.claude.com/docs/en/plugins-reference "Fields" and "Standard layout" tables, 2026-09-29 |
| F2 | Plugin `settings` takes effect only for `agent` and `subagentStatusLine`. A plugin cannot ship the main `statusLine`. The main status line is a user setting: a shell command that receives session JSON on stdin, re-run on events with a 300 ms debounce, plus an optional `refreshInterval` timer (minimum 1 s). It supports ANSI colour and OSC 8 links, and multiple lines. | verified-doc | https://code.claude.com/docs/en/plugins-reference (`settings` row); https://code.claude.com/docs/en/statusline ("Claude Code debounces updates at 300ms"; `refreshInterval` "minimum is `1`"), 2026-09-29 |
| F3 | Monitors (`experimental.monitors`): a shell command run for the whole session; its stdout lines reach Claude as notifications. Interactive sessions only, never `-p`, not on Bedrock, Google Cloud Agent Platform or Foundry. They cannot use `${user_config.*}` and do not receive `CLAUDE_PLUGIN_*` env. They stop only when the session ends. This is a channel to the model, not a display. | verified-doc | https://code.claude.com/docs/en/plugins-reference "monitors"; https://code.claude.com/docs/en/plugins/components "Monitors" |
| F4 | Artifacts: Claude publishes a single self-contained HTML or Markdown page to a private URL on claude.ai; "Anyone with the page open sees the update in place" on republish. Requires a claude.ai login (`/login`) on the Anthropic API; unavailable with an API key, gateway token, Bedrock, Vertex or Foundry, ZDR/HIPAA/CMEK orgs; off by default in Agent SDK and MCP-server contexts. The page has no backend, and its CSP allows `fetch`/WebSocket only to its own origin. A published page "can't call" local MCP servers; it can call claude.ai connectors through the viewer's account. Rendered size at most 16 MiB. No plugin-level API: Claude decides to publish, and publish needs permission on first use. | verified-doc | https://code.claude.com/docs/en/artifacts "Availability", "Page constraints", "Pull live data with MCP connectors", 2026-09-29 |
| F5 | MCP Apps (`ui://` resources, `_meta.ui.resourceUri`): Claude Code "does not advertise the `io.modelcontextprotocol/ui` capability" and drops the UI, returning the text result. The official MCP page documents `list_changed` and channels but nothing on UI resources. The tracking issue is open, opened 2026-09-17. Note: the issue is third-party evidence; the docs' silence is the official evidence. | verified-doc (docs silent) plus issue https://github.com/anthropics/claude-code/issues/95149 | https://code.claude.com/docs/en/mcp; the issue page, both 2026-09-29 |
| F6 | The VS Code extension is a chat panel with plugin management (`/plugins`), hooks view, session history. The docs describe no extension API for plugins to add panels or webviews. JetBrains was not fetched. | verified-doc (VS Code, absence); unverified (JetBrains) | https://code.claude.com/docs/en/ide-integrations, keyword scan for webview/panel API found none |
| F7 | A plugin can start a server only through a hook, a monitor, an MCP stdio server, or a command the model runs. Monitors and MCP servers are session-owned. No documented API starts a process that outlives the session (R3 F5-F6, decision 5). A local viewer therefore is the same kind of detached or on-demand process the engine already has to own. | inferred | F3 above; R3 report; decision 5 in the prompt |
| F8 | `claude` 2.1.284 is installed; docs facts above are current as of 2026-09-29. | verified-local | prompt §1 "This machine" (A1); not re-run here |

### B. Lisa candidates (tree `363e6a3`, compared with `76adfdc`)

| # | Claim | Tag | Evidence |
|---|---|---|---|
| F9 | `packages/web/src/App.tsx` is byte-identical at `76adfdc` and `363e6a3`. The 27-file difference between the refs touches `packages/dashboard` (the trajectory module, its React sections and CSS split were removed on `main`, and `App.tsx` was rewritten into a single 1,136-line change with one `styles.css`), `packages/server/demo-us8us11.mjs` (deleted), and one-line `package.json` edits in `rpc`, `server`, `tui`, `web` (licence). `web`, `server` and `tui` product code is unchanged. | verified-local | `cmp /tmp/specstride-research/R13/App.base.tsx App.main.tsx` -> identical; `git diff --stat 76adfdc 363e6a3 -- packages/web packages/server packages/tui packages/dashboard packages/rpc` |
| F10 | `kanbanColumns` and `budgetBurndown` are used by `App.tsx` and its test only. `@lisa/web` is imported by no other package. The dashboard that actually runs (`packages/dashboard`) does not depend on `@lisa/web` (deps: core, persistence, specs, react) and hard-codes five lanes. So the "pure view-model builders" are a specification-by-tests, not the production data path. | verified-local | `git grep "@lisa/web" 363e6a3` finds only `packages/web/`; `git grep "kanbanColumns\|budgetBurndown" 363e6a3 -- packages` finds only `web/src/App*.tsx` and a comment in `galaxy.ts:8`; `LISA-MAIN packages/dashboard/package.json` |
| F11 | Two lane vocabularies exist and disagree. `web`: `READY, EXECUTING, AWAITING_HUMAN, INTEGRATING, VERIFYING, COMPLETED, FAILED, BUDGET_EXCEEDED` (14 job states in `JobState`). `dashboard`: `QUEUED, EXECUTING, REVIEWING, COMPLETED, FAILED` labelled Ready / Building / Review / Done / Attention, with `STOPPED` folded into FAILED. | verified-local | `LISA-MAIN packages/web/src/App.tsx:32-35, 115-124`; `LISA-MAIN packages/dashboard/src/App.tsx:5-11, 545` and `types.ts:1` |
| F12 | The dashboard server is a plain `node:http` server that keeps job state in `.lisa-dashboard/jobs.json` (atomic tmp+rename, mode 0600), spawns `lisa` child processes, and recovers logs by scanning `.lisa/features/*/runs/*/events.jsonl`. It binds `127.0.0.1:13001` by default, but `vite` dev and preview scripts bind `0.0.0.0:13000`. The browser polls every 2-2.5 s; there is no push. | verified-local | `LISA-MAIN packages/dashboard/src/server.ts:27-28, 32, 175-215`; `package.json` scripts; `App.tsx:165-171, 192, 209` |
| F13 | `@lisa/server` is a Fastify daemon (RPC over WS and HTTP, bearer-token auth, webhooks) with an SSE read facade `GET /events/stream` fed by an in-process event bus (`this.bus.subscribe`). `listen` defaults to `127.0.0.1`. Its own header states the browser is a client of the RPC surface and "there is no privileged browser path". | verified-local | `LISA-MAIN packages/server/src/api.ts:1-22, 84-86, 176-206, 327` |
| F14 | `@lisa/tui` is a pure-logic package: `modes.ts` is a keyboard/view state machine (views: timeline, jobs, galaxy, approvals, events, plan; control modes: observe, interactive, autonomous), `presenter.ts` is a file follower with capability detection and plain-feed degradation, `watch-client.ts` is a Unix-socket RPC client. Its `package.json` says "Ink TUI" but no `ink` dependency exists in any package and `index.ts` calls itself a "Phase 1 scaffold"; the screen binding is absent. | verified-local | `LISA-MAIN packages/tui/src/{index,modes,presenter,watch-client}.ts`; `git grep '"ink"' 363e6a3 -- 'packages/*/package.json'` returns nothing |
| F15 | The presenter's follower polls the event file by stat and read at 300 ms and survives symlink retargeting via a `(dev, ino)` check. It needs no watcher and no daemon, and Specstride's `present.py` does the same (0.3-0.5 s sleeps, heartbeat after 2 s idle). Both are compatible with Principle I as written. | verified-local | `LISA-MAIN packages/tui/src/presenter.ts:379-412`; `/root/specstride/lib/present.py:530, 538, 561, 849-850` |
| F16 | `watch-client.ts` falls back to the plain event-file feed when no daemon listens, explicitly citing "Constitution I" (Lisa's). | verified-local | `LISA-MAIN packages/tui/src/watch-client.ts` header |
| F17 | The design tokens (`web/src/theme/tokens.ts`) include a WCAG contrast checker (`contrastRatio`, `passesAA`, `themeTextContrastReport`), a five-key state palette (`running, approved, rejected, awaiting, budget`) with glyph plus label plus colour (redundant encoding), and TUI theme resolution honouring `NO_COLOR` and `TERM`. These are renderer-side, pure and reusable. | verified-local | `LISA-MAIN packages/web/src/theme/tokens.ts:24-100, 103, 165-260`; `App.tsx:248` comment "FR-082" |

### C. The two builders (inputs and outputs)

| # | Claim | Tag | Evidence |
|---|---|---|---|
| F18 | `kanbanColumns(jobs: JobCard[]) -> KanbanColumn[]`. Input `JobCard = {id, title, state: JobState, planRevision, phase?, totalPhases?, costUsd, budgetUsd?}`. Output `{state, label, jobs}[]` in the fixed order of `KANBAN_LANES`, then any other state present appended in first-seen order. The 8 canonical lanes are always present, even when empty; a non-canonical lane appears only if it has jobs (the final `.filter` is `jobs.length > 0 \|\| KANBAN_LANES.includes(state)`). `label` is the raw state string. Deterministic; no clock, no fs; the only ordering inside a lane is input order. | verified-local | `LISA-MAIN packages/web/src/App.tsx:37-46, 114-145` |
| F19 | `budgetBurndown(jobs: JobCard[]) -> BudgetBurndown[]`. Output `{jobId, title, costUsd, budgetUsd?, fraction?, over}`; `fraction = costUsd / budgetUsd` only when `budgetUsd > 0`; `over = fraction > 1`. One number pair per job, USD only, no tokens, no time, no per-role split, no billing mode. | verified-local | `LISA-MAIN packages/web/src/App.tsx:147-171` |
| F20 | Companion pure builders in the same file and neighbours: `stateKeyFor(state) -> StateKey` (state to palette key), `planLevels(tasks)` (topological levels with a cycle guard), `galaxyBodies/galaxyView` (a jobs-to-bodies derivation, critical path, clusters, deterministic layout in `galaxy.ts`). The read model type is `DashboardData = {jobs, plan, approvals, schedules, events, galaxy?, replay?}`, "fed from `lisa.*.list` queries / SSE" (comment at line 29). So the inputs are RPC list results, not the raw event journal. That is exactly the layer decision 11 says must be derived from events and state files instead. | verified-local | `App.tsx:29, 79-90, 96-112, 173-219`; `galaxy.ts` exports at lines 24-340 |
| F21 | Mutations (approve, reject, stop job, run schedule, remove schedule, approve plan) are JSON-RPC calls behind a confirm callback. A viewer in Specstride is read-only at first; mutation through a UI would need a control channel that Principle I does not provide (the engine is controlled by files). | verified-local (`DASHBOARD_MUTATIONS`, `App.tsx:232-239, 553-557`); `inferred` for the Specstride consequence | as cited |

### D. dsh

| # | Claim | Tag | Evidence |
|---|---|---|---|
| F22 | The web client mounts plugin-contributed browser bundles: a package that declares `dsh.client` and exports `./client` is hashed into the boot graph and served under `/plugins`; bundles share shell-seeded React and a cordis loader. Panels present in the shell include jobs, plan, trajectory, workflow-run, subagent, deliverables, sidebar and layout (client packages `dsh-client-ui-*`). | verified-local | `ls $DSHPKG` (client-ui packages); `$DSHPKG/dsh-client-modules/README.md` ("Node half scans enabled Loader entries for web `dsh.client` packages ... serves each bundle ... under `/plugins`") |
| F23 | Tools can return provider-neutral render intents, cards `generic`, `terminal` and `diff`, so a UI need not special-case tool names. Command output goes to the adapter and never enters model history (R4 F8). No card type is a board or chart. | verified-local | `$DSHPKG/dsh-tools/README.md` lines 52, 109-111; R4 F8 |
| F24 | A custom client panel is therefore possible on dsh but is a cordis plugin coupled to rc internals (R4 F20: "tracks an rc seam"), needs the fail-open discipline of `dsh-trace-otel`, and works only in the web profile. Headless has no UI. | verified-local plus `inferred` | R4 F3, F9, F18, F20 |
| F25 | Since dsh's UI is already a browser, a local viewer URL is a first-class experience on dsh too, and a dsh page can link to it. | inferred | F22; the viewer is just a URL |

## The UI data contract

This is the deliverable for feature 111-observability (Wave 1). It is specified as a contract, not code.

### Position in the architecture

```
runtime (detached) --appends--> events (single schema, R14)  ┐
runtime / skill    --writes---> state files (run.json, ...)   ├──> project() ──> RunView ──> renderers
                                                              ┘     pure, no fs, no clock input except `now`
```

- **Truth = events plus state files.** `RunView` is a projection and never a second source of truth. Deleting any cached copy loses nothing. This is the direct application of decision 11 and it is what makes the doctor, `status`, the kanban and host status views agree by construction.
- **`project` is pure.** Signature (informal): `reduce(view: RunView, event: Event): RunView` and `project(events: Iterable<Event>, files: StateFiles, now: Date): RunView`. `now` is an argument so time-derived fields (elapsed, staleness) are testable. No I/O inside.
- **Two thin adapters outside the pure core**: a file reader that yields events from a byte cursor and tolerates a torn final line and a retargeted file (Lisa's `iterEvents` behaviour, F15), and a snapshot writer. A renderer never opens the event file itself.
- **Package boundary.** One TypeScript package, `view-model` (working name), with zero runtime dependencies and no `node:` imports in its core, so it can run in a browser, in the terminal, in a hook and in a test. Renderers depend on it; it depends on the event-schema package only for types.

### What `RunView` contains (v1)

Every field is derivable from events and state files. Field groups, not final names:

| Group | Content | Replaces / extends |
|---|---|---|
| `meta` | `schema: "specstride.view/1"`, `runId`, `generatedFromCursor {file, offset, lastSeq}`, `now`, `stale: boolean` (no event and no live lease for N s), `runState: starting \| running \| blocked \| paused-quota \| finished \| dead` | new; `dead`/`stale` come from the lease or pid file the engine keeps (R3 F5), not from a watcher |
| `features[]` | Spec Kit feature id, title, phase counts | Lisa `JobCard.title, phase, totalPhases` |
| `cards[]` | The kanban card. Unit = one **phase** of one feature (not a whole run). Fields: `id`, `featureId`, `title`, `lane`, `attempt`, `attemptsMax`, `pass`, `rejectCount`, `malformedCount` (survive resume, decision 23), `strategy: "classic" \| "micro-loops"`, `microLoop {unitsDone, unitsTotal?, lastCheck: keep \| repair \| escalate, layerOffForAttempt: boolean}?`, `flags[]` (`yielded`, `blocked-on-human`, `quota-paused`), `blockedReason?`, `lastVerdict {result, attempt, at}?`, `cost {usd, tokens}`, `elapsedMs`, `startedAt` | Lisa `JobCard`; adds attempt/verdict/strategy facts Lisa lacks |
| `lanes[]` | Canonical lane order with card ids: `queued, proposing, verifying, reviewing, approved, blocked, paused, failed`. Micro-loop cycles never own a lane: they are a sub-state of `proposing` (decision 21, "micro-loops add no stop reasons") | Lisa `KANBAN_LANES` (F11) |
| `budget[]` | One row per `(scope, role)`: scope is run or phase; role is proposer, critic, diagnostician, micro-check. Fields: `billing: "api" \| "subscription"`, `spentUsd?`, `tokens`, `capUsd?`, `fraction?`, `level: ok \| warn \| critical \| over`, `mode: "hard-cap" \| "alert"`, `quota {state: ok \| signalled \| paused, resetsAt?}` | Lisa `BudgetBurndown` (F19), extended for decision 8 |
| `attention[]` | The "clear signal when the run is blocked on me" (aim 3): items with `kind` (`blocked-on-human`, `quota-paused`, `same-model-critic-warning`, `dead-run`, `launch-check-failed`), `since`, `oneLine`, `nextAction` | new; the same list drives `SessionStart` re-attach text and the status line |
| `critic` | chosen critic, why (decision 17 order), same-model warning flag | new |
| `timeline[]` | Bounded tail (last N) of normalized rows `{seq, at, kind, cardId?, text}` plus `truncated: n` | Lisa `EventRow`; `presenter` timeline |
| `verification` | Running long checks: name, started, cycles done of total, first failure seen, fail-fast state | new; A5 says this is 64 % of run time, so it is the most valuable panel |

Deliberately not in v1: galaxy/critical-path (Lisa `galaxy.ts`) and a plan graph. The plan DAG can be added as an additive field, because the schema is versioned (`specstride.view/1`, additive within a major).

### Lane derivation (renderer independent)

A pure table in the contract, not in renderers: `(card facts) -> lane`, first match wins: `failed` (terminal failure/stop), `approved`, `paused` (quota), `blocked` (blocked-on-human), `reviewing` (critic call open), `verifying` (verification job open), `proposing` (pass open or micro-loop cycle open), `queued`. Renderers may hide or merge lanes, never re-derive them. This fixes the F11 divergence at its root: one vocabulary, defined once.

### Live-update model (contract level)

1. **Cursor.** `{file, offset, lastSeq}`. A renderer gets a full `RunView` (from `project` or a cached snapshot), then applies events after the cursor with `reduce`. Every event carries a per-run monotonic `seq` (a need on R14, see below).
2. **Transport is not part of the contract.** Allowed transports: (a) poll the file at 0.3-2.5 s (F12, F15), (b) SSE or long-poll from the viewer process, (c) re-run `specstride status --json` from a hook or status line. All three yield the same `RunView`.
3. **Snapshot cache** `view.json` is optional and disposable: written atomically (tmp + `mv`, as Principle I already requires for evidence) by whichever process computed it, keyed by cursor, ignored if older than the event file. The engine does not have to write it.
4. **Canonical serialization**: stable key order and no wall-clock fields except `now`, so `project(events)` is byte-comparable in golden tests (see Verification below).

### What the UI needs from the event schema (input to R14; R14 owns the schema)

| Need | Why |
|---|---|
| Per-run monotonic `seq` and an event `schemaVersion`; every event typed (Specstride's bash emitter writes every value as a string, `contracts/events.md` "Record shape") | cursoring, torn-line safety, no string-to-number coercion in renderers |
| Stable ids: `runId`, `featureId`, `phaseId`, `attempt`, `pass`, `role` on every event that has them | cards and per-role budget |
| Lifecycle events with explicit open/close: pass, micro-loop unit and check result, verification job start/cycle/first-failure/end, critic call, verdict | lanes and the `verification` panel |
| Cost events with `usd?`, `tokens`, `billing: api\|subscription`, `role`, `model` | `budget[]`, decision 8 |
| `quota_signal` and `resume_at`; `run_paused`, `run_resumed` | `paused` lane and its alert |
| `blocked` with a reason and the question for the human | `attention[]`; the 51-pass no-progress case in A5 |
| Restart/resume marker carrying the surviving counts (decision 23), and a counter-reset event when the flag is used | card counts stay meaningful across relaunch |
| `strategy` recorded per attempt, and `layer_off` with reason | decision 21 "every run records which strategy it used" |
| Critic selection event (which, why) | `critic` group, decision 17 announcement |
| Liveness is NOT an event stream requirement: use the engine's pid/lease file | avoids heartbeat noise in the journal |

State files the projection also reads: the run record (feature/phase plan, caps, config snapshot) and the lease/pid file. R14 and R3 own their formats.

### Verification of the contract itself

- Golden tests: fixture event logs (including the parity-oracle fixtures and a torn last line) produce byte-identical `RunView` JSON.
- Prefix property: `project(events[0..n])` equals folding `reduce` event by event (incremental equals batch).
- Renderer conformance: each renderer has a snapshot test from the same `RunView` fixtures. Nothing else may read the event file.
- Context budget (decision 16): `specstride status` (terse text from `RunView`) has a token budget in CI like any command output; `--json` and verbose are opt-in.

## Options compared

Live-update model, Principle I fit, port exposure, effort (T-shirt: S under 3 days, M about a week, L 2+ weeks, of TypeScript work excluding the shared contract), and which view models carry over. "Carry over" means what of Lisa's `App.tsx` builders and neighbours is reused as a design, not as code (code reuse is R1's call).

| # | Surface | Host | Live-update model | Principle I fit (no watcher, no daemon, files only) | Local port | Effort | View models that carry over | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | Local web viewer, on demand (`specstride ui`) | both | Browser polls `RunView` via server-side file poll (0.5-2 s) or SSE fed by that poll | Conforms if it is: read-only, started by the user, foreground or tied to its parent, never in the control path, no state of its own. It is a new long-lived process, which the letter of Principle I ("any feature that adds a daemon/watcher violates") could read as forbidden. Needs an amendment sentence (see risks). Lisa's Fastify server would not conform (F13) | Yes, one loopback port. Bind `127.0.0.1` only (Lisa's vite scripts bind `0.0.0.0`, F12), ephemeral port, random token in URL, `Host`/`Origin` check; R11 owns the hardening | M | `kanbanColumns`-style lanes, `budgetBurndown`, `stateKeyFor`, tokens and contrast checker, `planLevels` if a plan panel is added | **Recommended for Wave 2** |
| 2 | Artifact page from exported state | Claude Code only (needs claude.ai login) | Static snapshot; updates only when Claude republishes (F4). A connector-backed live page cannot read local state (local MCP not callable, F4) | Conforms: it is a file export. But publishing is a model action and uploads data to Anthropic's servers | None locally; page is on claude.ai. Privacy consequence: run data leaves the machine (R11 / decision 19 concern) | S (an export command that emits one HTML file; the model publishes it) | Whole `RunView` rendered to HTML/SVG | Optional Wave 2 add-on, off by default; never the primary UI |
| 3 | MCP UI resource (MCP Apps, `ui://`) | none today | n/a | n/a | n/a | n/a (blocked upstream) | n/a | **Rejected for now**: Claude Code drops the UI (F5). Revisit if the issue closes. Server-side cost would be a resident MCP tool schema, which decision 16 disfavors anyway (R4 option C) |
| 4 | IDE webview | none | n/a | n/a | n/a | n/a | n/a | **Rejected**: no plugin UI API found (F6). The viewer in an IDE simple-browser tab is item 1 |
| 5 | Terminal follower (`specstride watch`) | both (separate terminal or tmux pane; cannot draw inside a Claude Code session) | Poll the event file at 300 ms, heartbeat when idle (F15) | Full fit; it is exactly today's `present.py` and Lisa's `iterEvents` | None | M (port `present.py` behaviour plus a `RunView` card view; skip Ink) | Lanes as columns or rows; `budget`; plain-feed degradation from `tui/presenter` (F14) | **Recommended for Wave 2** |
| 6 | Status line | Claude Code (user's `statusLine` script), not shippable by plugin (F2) | Event-driven with 300 ms debounce, plus `refreshInterval` | Full fit if the script calls `specstride status --line` (reads files) | None | S (a one-line renderer and a doc snippet; the user opts in) | `attention[]`, `runState`, lane counts, `budget` level | Wave 1 doc plus command; the plugin cannot install it |
| 7 | Monitor notifications | Claude Code, interactive only (F3) | Process stdout lines pushed to the model | Fit as a reader of files; but each line costs context and the model must react | None | S | `attention[]` transitions only | Only for `attention`, not for the board (context cost, decision 16). Belongs to R3's push design |
| 8 | dsh web client panel (`dsh.client` bundle) | dsh (web profile only) | Whatever the panel implements (WS to the dsh host) | Fits only if the panel reads `RunView` files; in-process cordis plugin | dsh's own web port, loopback-fenced | L (cordis plugin, rc-coupled, per-upgrade re-test; F24) | `RunView` as the panel's model | Later; item 1 already works on dsh (F25) |
| 9 | dsh command / tool-result card | dsh (command in web only) | On demand | Fit | None | S | text `status` | Use for `/specstride-status` text only (R4 Q5) |
| 10 | Lisa dashboard as-is (`packages/dashboard`) | either | Poll 2-2.5 s of its own REST/JSON store (F12) | Its own `jobs.json` store and spawned children make it a second state owner, which conflicts with decision 11 | `127.0.0.1:13001` plus vite `0.0.0.0:13000` | n/a | Its lanes conflict with `web`'s (F11) | Not reused as is |
| 11 | Lisa server as a UI backend | either | SSE from in-process bus (F13) | A Fastify daemon with auth and an event bus; needs the Lisa daemon running. Violates Principle I's daemon clause and duplicates the detached runtime | loopback by default plus bearer tokens | n/a | n/a | Not reused for the UI. Whether it is reused elsewhere is R1's |

## Recommendation

**Wave 1 (contract only, feature 111-observability):**
1. Specify `RunView` v1, `reduce`/`project`, the lane-derivation table, the cursor protocol and the canonical serialization (all above), in a package with zero I/O in its core.
2. Ship the first consumer so the contract is exercised: `specstride status` (terse text, `--json` for the full `RunView`, `--line` for one line). It serves the skill's supervision cycle, hooks, the doctor's run section and a user-supplied `statusLine` script.
3. Add the contract's golden and prefix tests to the parity/CI harness. Send the event needs table to R14 as a requirement.
4. Do not build any graphical renderer in Wave 1 (decision 13 puts the kanban UI in Wave 2).

**Wave 2 (renderers, feature 121-kanban-ui):**
1. `specstride ui`: on-demand, read-only, loopback-only local web viewer with a kanban view (lanes from `RunView`), a budget/quota strip, an attention banner and a verification panel. Single static bundle, no SPA build server, no daemon: it exits when its terminal or parent exits, and it never writes run state. Same URL on Claude Code and dsh. Host plugins only add a skill line that says how to open it; R11 hardens the port.
2. `specstride watch`: terminal follower (port of `present.py`'s behaviour) rendering `RunView`, with plain-feed degradation.
3. `specstride ui --export html`: one self-contained file the model can publish as an Artifact when the user asks, off by default, with a data-leaves-the-machine notice.
4. Explicitly out: MCP UI resources, IDE panels, dsh client bundles (revisit on evidence), and any UI that mutates run state (control stays file-based; a later "approve" button would write a file the runtime already polls, decided separately).

**Confidence:** high (0.85) on the contract and on rejecting MCP UI and IDE panels; medium (0.65) on making the local viewer Wave 2's primary board, because it depends on the owner accepting the Principle I clarification below.

Lisa reuse, as input to R1: the value is the design of `kanbanColumns`, `budgetBurndown`, `stateKeyFor`, the token/contrast checker and the presenter's follower (each is under 200 lines and pure). The server and the dashboard are the wrong shape. No Lisa code is required to deliver this recommendation; porting the pure pieces is cheaper than adapting their RPC-list inputs.

## Version/date pins

| Item | Pin | Verified on |
|---|---|---|
| Claude Code docs | code.claude.com/docs (plugins-reference, statusline, artifacts, mcp, ide-integrations) as served | 2026-09-29 |
| Claude Code installed | 2.1.284 (from prompt §1; not re-run) | 2026-09-29 |
| MCP Apps in Claude Code | unsupported; issue anthropics/claude-code#95149 opened 2026-09-17 and open | 2026-09-29 |
| Artifacts constraints | as served on the artifacts page (CSP, 16 MiB, login required) | 2026-09-29 |
| dsh | 0.1.0-rc.8, package READMEs under `/usr/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai` | 2026-09-29 |
| Lisa | `76adfdc` (baseline) and `363e6a3` (local main, committed 2026-09-27); `web/src/App.tsx` identical | 2026-09-29 |
| Contract schema id | `specstride.view/1` (proposed) | n/a |

## Matrix rows

Host Capability Matrix, "UI surfaces" column only (other columns belong to R3 and R4):

| Host | Skills | Hooks | Background processes | UI surfaces | Packaging | Evals |
|---|---|---|---|---|---|---|
| Claude Code 2.1.284 (docs 2026-09-29) | (R3) | (R3) | (R3) | No plugin UI component. Usable: user-supplied `statusLine` script (plugin ships only `subagentStatusLine`); Monitor notifications (interactive only, text to the model); Artifacts (claude.ai login, static page, republish updates in place, cannot call local MCP); terminal follower in a separate terminal; local browser viewer started by a command. Not available: MCP UI resources (`ui://`), IDE webviews/panels | (R3) | (R3) |
| dsh 0.1.0-rc.8 | (R4) | (R4) | (R4) | Web client only: plugin `dsh.client` bundles (rc-coupled, web profile), commands (web only, off-history), tool-result cards (`generic`, `terminal`, `diff`); no TUI, no status line; a local browser viewer works unchanged | (R4) | (R4) |

## Open questions / risks

1. **DECISIONS-PENDING candidate, Principle I and the viewer.** Principle I says "any feature that adds a daemon/watcher violates this principle" (`constitution.md:117-118`). The recommended `specstride ui` is a long-lived local HTTP process. Default I proceed on: it is allowed because it is a user-started, read-only presentation process outside the coordination path, polling files (as `present.py` and Lisa's presenter already do), with no state of its own. This needs one clarifying sentence in `constitution-amendment.md`. If the owner rules the letter of Principle I applies, Wave 2 drops the web viewer and ships only `specstride watch` (terminal), the status line and the Artifact export, and the "kanban UI" becomes terminal-only.
2. **Unit of the card.** I chose the phase as the card and the feature as a group. Lisa's card is a job (a whole run). If the owner expects one card per feature, only the `cards[]` grouping changes; the contract is otherwise unaffected.
3. **Two Lisa lane vocabularies (F11).** Which one, if either, R1 keeps is R1's ruling; the Specstride lane set here is derived from the loop's own facts, not from either.
4. **Artifact route leaks run data to Anthropic-hosted storage** and needs a claude.ai login on the Anthropic API. It is not available with API-key, gateway, Bedrock, Vertex or Foundry sessions (F4). Keep it opt-in; R11 and decision 19 should weigh in.
5. **Port exposure** (R11): loopback bind, random per-launch token, `Host`/`Origin` checks, no CORS, read-only routes. Lisa's `vite --host 0.0.0.0` scripts are a counter-example (F12).
6. **Mutation from the UI is out of scope.** Lisa's dashboard mutates via JSON-RPC (F21). Specstride's control plane is files; a UI approve/stop would write control files the runtime reads. Not designed here.
7. **JetBrains and Claude Desktop preview panes were not checked** (F6). Both stay `unverified`; a local browser viewer covers them regardless.
8. **`stale`/`dead` depends on a lease or pid file** owned by the runtime design (R3 F5, decision 5). If the runtime cannot provide one, `dead` cannot be derived and the run-state group degrades to "no events for N seconds".
9. **The event needs table is a requirement on R14.** If R14 keeps string-only bash-style values or lacks `seq`, the reducer must coerce and cursor by byte offset only; it still works, less robustly.
10. **A5 shows most run time is long verification.** The `verification` panel is only as good as the start/cycle/first-failure events the runtime emits; that belongs to R14 and the fail-fast work (R21).
