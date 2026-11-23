# R11 — Security and threat model

Report date: 2026-09-29. Defensive design work for the owner's own product. No product code was
written, no source repository was modified, no credential file was read, no paid model call was made.

Tags: `verified-doc` (URL, accessed 2026-09-29), `verified-local` (`file:line` or command),
`inferred` (facts named), `unverified` (what was tried). Paths without a root are relative to
`/root/specstride` at `9cab15d` (working tree confirmed at that commit: `git rev-parse HEAD` →
`9cab15d2d08f…`).

---

## Prior art consulted

| Source | What it gave | Reused / extended / contradicted |
|---|---|---|
| `prompts/specstride-ecosystem.md` §0–§2, §4 row R11, §6 | Decisions 5, 6, 7, 17, 18, 19, 21; feature list | Binding. Built on as written. |
| `.specify/memory/constitution.md` v2.0.3 | Principles I, II, III, VIII, IX, XI; "Credentials on hand"; single run per workdir | **Reused** II/III/IX as the core gate defences. **Extended**: II protects the verdict *line*, not the approval *marker* (finding F-03). **Contradicted in code**: IX says "a critic path that can call tools is not shipped", but one CLI critic arm at the baseline passes an allow-all flag (F-08). |
| `lib/critic.py` | Nonce generation, prompt assembly, verdict parser, provider dispatch, transcript writing, deterministic probes | **Reused** as the reference design for the nonce verdict. **Extended** with the gaps in F-02…F-07. |
| `orchestrator.sh`, `proposer.sh`, `specstride` | Approval check, resume derivation, lock, `stop.flag`, `proposer.pid`, permission flags per backend | **Reused** for the as-is attack surface. |
| `lib/observability_policy.py`, `lib/backend_overlay.py` | Redaction patterns; overlay seed credential check | **Reused** as the starting redaction rule set; **extended** (patterns are narrow, F-12). |
| `/root/specstride-otel-prompts` commit `936afea` (diff against `9cab15d`) | Prompts on spans, critic prompt file, child trace context | **Extended**: redaction is fail-closed (good) but content capture is on whenever traces are on, and the prompt file carries the nonce (F-05, F-13). |
| `old/028-as-is-specstride/` | 028 FR-005, FR-010, FR-028, SC-002, SC-007; contracts | **Reused**. 028 SC-007 confirms no backend declares an overlay in the shipped tree, so Principle VIII's throwaway config home is aspirational today. |
| `old/002-as-is-lisa/` | 002 FR-019, FR-022 (ensemble, nonce reuse), FR-025/026 (approvals with frozen target hash), FR-049 (bearer auth), FR-052 (fail-closed hooks), FR-013 (atomic writes) | **Reused** as mitigations to adopt: target-hash binding, fail-closed blockable hooks, bearer auth, loopback bind. |
| `/root/lisa` `packages/server/src/api.ts`, `packages/cli/src/commands/serve.ts` | Server bind address and token table | **Extended**: loopback default and bearer auth exist; no `Origin`/`Host` validation found (F-16). |
| `/root/mixture-of-loops` at `9c88f86`, `scripts/supervisor_lib.py` | PID/PGID record, `killpg`, PID-reuse guard through `/proc/<pid>/cmdline` | **Reused**: the command-line marker check is the right idea; it has no macOS equivalent in the code (F-18). |
| `prompts/analysis/A8-micro-loops-and-parity.md` §4 (G1–G7), §3.5 | Gate-integrity rules for the micro-loop layer | **Reused**. R11 lists the threats; R23 designs the rules. R11 adds threats A8 does not name (check-input tampering through indirect files, marker forgery, config in the repository). |

---

## Questions answered

### Q1. What are the trust boundaries?

```
                         CONSUMER (human)  ── trusted principal
                               │ invocation + free-text comment (decision 18)
   ┌───────────────────────────▼─────────────────────────────┐
   │ TB1  HOST SESSION (Claude Code / dsh) — host model +     │  semi-trusted: a model that
   │      specstride-run / specstride-reverse skills          │  reads untrusted repo text
   └───────────────┬─────────────────────────────▲───────────┘
        CLI calls  │  (argv, exit code, terse stdout)         │ status / digest
   ┌───────────────▼─────────────────────────────┴───────────┐
   │ TB2  SPECSTRIDE CLI + DETACHED RUNTIME (TypeScript)      │  TRUSTED COMPUTING BASE
   │      engine, gate, verdict parser, check runner, lock    │  (npm package: TB9)
   └──┬──────────────┬───────────────┬──────────────┬────────┘
      │ spawn        │ spawn/HTTP    │ files        │ events
   ┌──▼────────┐  ┌──▼─────────┐  ┌──▼──────────┐ ┌─▼──────────────────┐
   │TB3 PROPOSER│  │TB4 CRITIC  │  │TB5 STATE    │ │TB6 OBSERVABILITY   │
   │ harness,   │  │ tool-less, │  │ control vs  │ │ event log → OTel   │
   │ all tools  │  │ fresh      │  │ workspace   │ │ exporter → collector│
   │ UNTRUSTED  │  │ UNTRUSTED  │  │ files       │ │ (off-host = TB6b)  │
   │ OUTPUT     │  │ OUTPUT     │  └──▲──────────┘ └─▲──────────────────┘
   └──┬─────────┘  └────────────┘     │ read-only     │ read-only
      │ reads/writes                  │               │
   ┌──▼──────────────────────┐   ┌────┴───────────────┴──┐
   │TB7 REPOSITORY CONTENT   │   │TB8 KANBAN / UI        │ browser = hostile origin
   │ specs, code, deps, docs │   │ local web server or   │ environment
   │ project specstride.yaml │   │ exported page         │
   │ UNTRUSTED DATA          │   └───────────────────────┘
   └─────────────────────────┘
   TB3a tested adapter (version-pinned)   TB3b discovered / descriptor-driven adapter (unverified)
   TB10 provider endpoints / host model gateway (network)
```

Trust assignments (`inferred` from decisions 5, 7, 17 and Principles II, III, IX):

| Zone | Trusted for | Not trusted for |
|---|---|---|
| Consumer | Intent, config in the **user** config file, CLI flags, env | — |
| Host model (TB1) | Judgment calls inside limits the runtime enforces | Any security decision. It has read repository text and the comment, so it may be steered. |
| Runtime (TB2) | Everything: it is the only component that may write control state, parse a verdict, run a check | — |
| Proposer (TB3) | Producing work in the workspace | Any statement about its own work; any file it could have written |
| Critic (TB4) | One verdict line, nonce-bound | Anything else in its reply; side effects (it must have none) |
| Repository content (TB7) | Being the subject of work | Instructions, config that widens capability, commands to run |
| Discovered descriptor (TB3b) | Describing how to invoke a harness **when it comes from the user scope** | Anything when it comes from the project scope; capability claims until probed |
| State files (TB5) | Control plane files written by the runtime in a location the proposer cannot write | Any file inside the proposer's write scope |
| UI (TB8) | Rendering | Writing anything; being reachable only by the consumer |

### Q2. How does the per-call nonce verdict protect today, and where does it stop?

What it does (`verified-local`):

- A fresh nonce per critic call: `nonce = secrets.token_hex(8)` — 16 hex characters, 64 bits
  (`lib/critic.py:2690`).
- The verdict is parsed **only from the critic's reply**, never from the evidence, with a pattern anchored
  to the full line and the exact nonce: `^\s*VERDICT\s+<nonce>\s*:\s*(APPROVED|REJECTED)\s*$`
  (`lib/critic.py:1847-1851`).
- Zero matches, a verdict line with another nonce, or more than one match give `MALFORMED`
  (`lib/critic.py:1852-1860`), which is treated as a rejection. A transport error is also `MALFORMED`
  (`lib/critic.py:2728-2742`). This is fail-safe (028 FR-005, 028 SC-002, Principle II).
- The nonce is created after the proposer loop has exited (Principle I), so a proposer-written file
  cannot contain it.

Where it stops (each is a finding below):

| Limit | Finding |
|---|---|
| It authenticates the verdict **line**, not the critic's **reasoning**. Text in the evidence or in a grounded file that persuades the critic to approve produces a genuine, correctly nonce-bound `APPROVED`. | F-02 |
| Approval is stored as an **empty marker file** in a directory the proposer can write. Resume trusts marker presence alone. | F-03 |
| The evidence is inserted into the critic prompt verbatim, with no neutralization of the section delimiters, so evidence can imitate a "GROUNDING SNAPSHOT" or "SPEC" section. | F-04 |
| The nonce is written to disk in debug mode before the call, and (in the OTel prompt work) into a prompt file and a span attribute. A tool-less critic cannot exploit this; a critic with tools, or a concurrent process, could. | F-05 |
| Injection can force `MALFORMED` (for instance by making the critic quote two verdict lines), and three in a row halt the run. The nonce turns forgery into denial of service; it does not remove the attacker's influence. | F-06 |

### Q3. How can repository content reach the proposer or critic?

| Channel | Reaches | Evidence |
|---|---|---|
| Spec Kit files (`spec.md`, `plan.md`, `tasks.md`), read by the proposer and rendered into the critic's design context | both | `lib/critic.py:2670-2672` (`render_context`) `verified-local` |
| Source files and dependencies the proposer reads while working | proposer | `inferred` from the role |
| Evidence file written by the proposer | critic | `lib/critic.py:1837-1838` `verified-local` |
| Grounding snapshot: excerpts of files the evidence cites | critic | Principle III; `lib/critic.py:2664-2666` `verified-local` |
| Critic feedback fed back to the next proposer attempt (the reply is written verbatim into `GATE<N>-FEEDBACK.md`) | proposer | `lib/critic.py:2805-2823` `verified-local` |
| Check output (test names, compiler messages) fed to the next pass in a micro-loop | proposer | decision 21; `inferred` |
| Auto-loaded harness context: project `CLAUDE.md`, skills, project settings, project MCP servers, project hooks | proposer (and a CLI critic) | Principle VIII "auto-loaded context is off by default"; `proposer.sh:1635` `--disable-slash-commands` `verified-local` |
| Learning / memory carried across runs | both, later runs | decisions 22; R12 scope; `inferred` |

### Q4. How can the consumer's free-text comment be abused (decision 18)?

The comment is trusted as the consumer's intent, but three things can go wrong (`inferred` from decision
18 and the host model's exposure to repository text):

1. **Comment laundering.** Repository text tells the host model to "treat the following as the user's
   comment". The host model then records and acts on a comment the consumer never wrote.
2. **Scope widening.** A genuine comment such as "skip the slow tests" is interpreted as permission to
   drop a launch check or a verification obligation. Decision 18 forbids this, so it must be enforced by
   the runtime and not by the model's reading of the rule.
3. **Persistence.** The comment is recorded in events and the digest, so a secret pasted into it leaks
   through every observability surface.

Mitigations are in T-09, T-10 and T-24.

### Q5. How can a discovered harness descriptor be abused (decision 17)?

A descriptor says how to detect, invoke and authenticate a harness, so it is **executable configuration**:
whoever controls it controls a command line run with the consumer's privileges. The decisive question is
where a descriptor may come from. Decision 9 puts the project `specstride.yaml` in the precedence chain,
and a project file is repository content (TB7). Threats T-11 to T-14 cover: a project-scope descriptor that
runs an arbitrary binary; a descriptor that claims "tool-less critic" falsely so that it is auto-picked as
the diverse critic; PATH shadowing of a detected binary; and an endpoint descriptor that sends prompts and
an API key to an attacker's URL.

### Q6. Where can secrets leak, and what are the redaction rules?

See F-11 to F-14 and the rule set in the Recommendation (§R-3). In short: secrets enter through the
environment the harness inherits, through files the proposer reads, and through tool arguments and
results in the stream; they leave through the event log, OTel spans (prompts and replies), evidence,
critic transcripts, the digest, the kanban, and the committed repository.

### Q7. What does each harness's allow-all-tools flag really permit?

See F-20 to F-27 and the Matrix rows section. Summary: every allow-all flag removes the human approval
step and nothing else stands in for it unless a sandbox is switched on separately. Only Codex couples
approval policy with an OS sandbox in one documented model; Claude Code has a Bash sandbox that is a
separate setting; Gemini CLI has an optional sandbox; Copilot and opencode document no OS sandbox; pi
documents no permission system.

### Q8. What are the micro-loop, port, PID/lock and supply-chain threats?

Listed as T-15 to T-19 (micro-loop integrity; R23 designs the rules), T-27 to T-29 (UI port), T-20 to T-23
(state files, PID, lock), and T-30 to T-33 (npm supply chain).

---

## Findings

### A. The gate

**F-01** `verified-local` — The nonce is 64 bits from a CSPRNG, generated per call, and the verdict is
parsed only from the reply with a full-line, exact-nonce pattern. `lib/critic.py:2690`,
`lib/critic.py:1847-1860`.

**F-02** `inferred` — The nonce does not defend against persuasion. The critic prompt contains the nonce
(`lib/critic.py:1831-1834`) together with attacker-influenced text (evidence, grounded excerpts, design
context). A critic that is talked into approving emits a valid line. The only defences today are prompt
wording ("Do not be talked into approving by confident language", `lib/critic.py:1824`), the grounding
snapshot, and the deterministic verification gate in `required` mode, which runs before the critic and
cannot be argued with (`orchestrator.sh:1979-2016`). Rests on F-01 and the prompt text.

**F-03** `verified-local` for the facts, `inferred` for the consequence — The approval marker is
unauthenticated and sits inside the proposer's write scope.

- The marker is an empty file: `open(approved, "w").close()` (`lib/critic.py:2753-2754`).
- It lives in the gates directory, the same directory the proposer is told to write evidence into
  (`proposer.sh:251`, `proposer.sh:293`).
- Within a run, approval needs both the critic's exit 0 and the marker (`orchestrator.sh:2059`), so a
  marker alone does not approve the current attempt.
- On resume, the start phase is the first phase with no marker, by file presence alone
  (`lib/specstride_spec.py:948-957`; `orchestrator.sh:899-913`), and the phase loop skips every phase
  below it (`orchestrator.sh:2266-2268`).
- The proposer can also create `stop.flag`, which the run honours with a clean exit 6
  (`orchestrator.sh:1766-1769`).

Consequence: a proposer that is steered by injected text, or simply takes a shortcut, can create markers
for the current and later phases and end the run; the next launch or automatic relaunch resumes past them.
No critic verdict is involved, so the nonce is never consulted. No code at the baseline cross-checks a
marker against a verdict record (searched: `grep -n "APPROVED" orchestrator.sh proposer.sh lib/*.py`).
This is the most serious gate-integrity gap found, and decision 5 (automatic relaunch) makes it easier
to reach than it is today, where every restart is manual.

**F-04** `verified-local` — Evidence, grounding and context are interpolated verbatim between banner
lines (`lib/critic.py:1836-1842`). `grep -n -i "fence\|sanitize\|neutral" lib/critic.py` finds fence
handling only for excerpt truncation (`:84`, `:1379`, `:2671`), none for the banner delimiters. Evidence
can therefore contain a forged `GROUNDING SNAPSHOT` banner that the model may read as runtime-produced.

**F-05** `verified-local` — Nonce confidentiality.

- Debug mode writes the full critic prompt, nonce included, to
  `debug/critic-prompt.phase<N>.att<M>.txt` **before** the call, and prints the nonce to stderr
  (`lib/critic.py:2704-2707`).
- The transcript, written after the call, records the nonce (`lib/critic.py:2792-2797`). This is harmless
  because the nonce is spent.
- In `/root/specstride-otel-prompts` (`936afea`), when traces are on the critic prompt is written to
  `critic-prompt.phase<N>.txt` at `critic_start`, again before the call, and its text becomes
  `input.value` on the span (diff of `lib/critic.py` `_write_prompt_file`; `lib/ralph_otel_spans.py`
  `prompt_file_attrs`).

`inferred`: with a tool-less critic and no proposer running, nothing can read these in time. The exposure
becomes real if a critic path has file or shell tools (F-08), or if parallel execution (R26) ever lets a
proposer run while a critic call is in flight.

**F-06** `inferred` — Forced `MALFORMED` as denial of service. Three consecutive `MALFORMED` verdicts halt
the run (`orchestrator.sh:223`, `:2155-2160`; 028 FR-010). Evidence that induces the critic to print two
verdict lines, or none, stops an unattended run without approving anything. Fail-safe, but it costs
availability.

**F-07** `verified-local` — The critic's reply is written verbatim into the feedback file that the next
proposer attempt reads (`lib/critic.py:2813-2823`). A critic that has been injected is therefore a relay
into a session that has all tools. `inferred`: this is a second-order injection path from repository
content to the proposer.

**F-08** `verified-local` — Not every critic path at the baseline is tool-less.

- The Claude critic is a direct HTTP call with no tools (`lib/critic.py:1875-1899`).
- The dsh critic disables every model-facing tool through a patch and sets
  `DSH_PERMISSION_MODE=read-only` (`lib/critic.py:2104-2141`, `:2158`).
- The CLI critic arm of a locally registered backend passes `--dangerously-skip-permissions` and sets
  `IS_SANDBOX=1` (`lib/critic.py:1927-1929`).

The last contradicts Principle IX. It matters for the consolidation because decision 6 makes a CLI
subprocess the **default** critic path at Tier 1: the tool-less property must then be enforced by flags
the adapter controls and verified by a probe, not assumed.

**F-09** `verified-local` — Lisa's ensemble rule rejects a second judge that reuses the primary's nonce
(002 FR-022), and Lisa's approvals bind a decision to a frozen target hash and refuse a stale one
(002 FR-025, 002 SC-006). Both are patterns the new gate should adopt: one nonce per call per judge, and
an approval record bound to the hash of what was approved.

### B. Proposer sandboxing

**F-10** `verified-local` — What the baseline passes to each proposer.

| Backend | Flag or mode | Where |
|---|---|---|
| claude | `--dangerously-skip-permissions --verbose`; `--disable-slash-commands` unless `SPECSTRIDE_PROPOSER_SKILLS=1` | `proposer.sh:1621-1635` |
| codex | `--dangerously-bypass-approvals-and-sandbox`, prompt as an argument | `proposer.sh:586-589` |
| dsh | `DSH_PERMISSION_MODE` defaulting to `workspace-write`, with a throwaway `DSH_HOME` overlay | `proposer.sh:555-566` |
| prime | `-p --mode <mode> --no-session`, prompt on stdin | `proposer.sh:599-602` |
| root handling | When running as root with `IS_SANDBOX` unset, the scripts export `IS_SANDBOX=1` so that Claude Code accepts the bypass flag | `proposer.sh:264-268`, `orchestrator.sh:878-881` |

`inferred`: `IS_SANDBOX=1` asserts a sandbox that does not exist. It defeats a vendor safety check
(F-20) rather than providing isolation. That is acceptable on the owner's own machines as a conscious
choice; it must not ship as default behaviour in a distributed product (decision 19).

**F-11** `verified-local` — No backend declares a config-home overlay in the shipped tree, so every
backend runs against the operator's real environment (028 SC-007; `lib/backends.py:43-45`). The proposer
therefore inherits the full process environment, including provider keys, and can read the user's home
directory. Principle VIII's "throwaway config home" is met only by the dsh arm. Decision 6 Tier 1 requires
the user's logged-in CLI config, so a full throwaway home is not available there; the tension is already
recorded in §2 of the prompt.

### C. Secrets and telemetry

**F-12** `verified-local` — The baseline redaction policy.

- Key names redacted: `api_key`, `apikey`, `authorization`, `cookie`, `credential`, `password`, `secret`,
  `token`, `access_token`, `refresh_token`, `client_secret` (`lib/observability_policy.py:12-15`), matched
  as the **whole** key (`:82-83`), so `github_token` or `ANTHROPIC_API_KEY` as a key name is not matched.
- Value patterns: `bearer <…>`, `sk-…`, `gh[pousr]_…`, and `api_key|token|secret|password = value`
  (`lib/observability_policy.py:16-21`).
- Not covered (`inferred` from the pattern list): cloud access key ids, private-key PEM blocks, JWTs,
  connection strings with embedded passwords, provider key prefixes other than `sk-`, high-entropy strings
  in general, and any secret split across lines.
- Thinking content is dropped (`lib/observability_policy.py:11`, `:116`).

**F-13** `verified-local` — Prompts on spans (`936afea`).

- Content is redacted with the same policy and capped at 256 KiB (`SPECSTRIDE_OTEL_PROMPT_MAX`); agent
  text is capped at 16 KiB.
- Redaction is fail-closed: if the policy cannot be loaded the content is dropped, "never shipped
  unredacted" (`content_attrs`).
- Span-only content never enters the event stream or Loki.
- There is no separate switch: content is captured whenever traces are enabled
  (`SPECSTRIDE_OTEL_ENABLED=true`). The proposer prompt contains spec text, feedback and repository
  excerpts, so the whole prompt leaves the host whenever a remote collector is configured.
- Open scopes park their content in a side file `<state>.<span_id>.content.json` until the span closes;
  the file is removed when read. A crash leaves it behind.

**F-14** `verified-doc` — OpenTelemetry's position: "OpenTelemetry collects telemetry data, but it can't
determine what data is sensitive in your specific context on its own", and "Only collect data that serves
an observability purpose." The collector offers `attribute`, `filter`, `redaction` and `transform`
processors. https://opentelemetry.io/docs/security/handling-sensitive-data/ (accessed 2026-09-29).

**F-15** `unverified` — The GenAI semantic conventions' exact wording on content capture (opt-in, the
`gen_ai.input.messages` family, stability). Tried
https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/ (now only a notice that the conventions
moved) and https://github.com/open-telemetry/semantic-conventions-genai (repository overview only, no
convention text retrieved). R14 owns the schema and should pin this. The recommendation below does not
depend on it.

### D. UI, state, process

**F-16** `verified-local` — Lisa's server binds `127.0.0.1` by default and takes the host from
`LISA_SERVER_HOST` (`/root/lisa/packages/server/src/api.ts:327-329`,
`packages/cli/src/commands/serve.ts:168`). Authenticated routes need a bearer token; `/healthz` does not
(002 FR-049). The token table is a plain object lookup (`api.ts:63-67`). A search for `origin`, `Host`,
`Access-Control` in `packages/server/src` and `serve*.ts` found no `Origin` or `Host` header validation.
The tree read was the checked-out branch `feat/dashboard-trajectory-redesign`.

**F-17** `verified-doc` — The MCP specification's warning for local HTTP servers applies equally to a
local kanban server: "Servers **MUST** validate the `Origin` header on all incoming connections to prevent
DNS rebinding attacks", "When running locally, servers **SHOULD** bind only to localhost (127.0.0.1)
rather than all network interfaces (0.0.0.0)", "Servers **SHOULD** implement proper authentication for all
connections".
https://modelcontextprotocol.io/specification/2025-06-18/basic/transports (accessed 2026-09-29).

**F-18** `verified-local` — Process control by recorded PID.

- `specstride stop --now` reads `proposer.pid` from the state directory and kills that PID and its
  descendants after a bare `kill -0` liveness check (`specstride:555-566`). There is no check that the PID
  still belongs to the run.
- mixture-of-loops records `pid` and `pgid` and uses `os.killpg` (`supervisor_lib.py:605-623`, `:691`).
  Its liveness check guards against PID reuse by requiring a recorded marker in `/proc/<pid>/cmdline`
  (`supervisor_lib.py:718-744`); its own comment says a system without `/proc` would read a reused PID as
  alive. macOS has no `/proc`.

`inferred`: a PID file inside the proposer's write scope lets the proposer aim a later `stop --now`, or an
automatic relaunch's cleanup, at any process the consumer owns.

**F-19** `verified-local` — The lock is `flock` on a file in the state directory, with an atomic `mkdir`
fallback (`orchestrator.sh:506-522`). The kernel lock cannot be forged by writing the file. The `mkdir`
fallback can: any process that creates `<lock>.d` blocks every later run (exit 5) until a human removes
it.

### E. What allow-all flags permit (official documentation)

**F-20** `verified-doc` — Claude Code, https://code.claude.com/docs/en/permission-modes (accessed
2026-09-29); installed `claude` 2.1.284 (`claude --version`).

- "`bypassPermissions` mode disables permission prompts and safety checks so tool calls execute
  immediately, including writes to protected paths."
- "`bypassPermissions` offers no protection against prompt injection or unintended actions."
- "Only use this mode in isolated environments like containers, VMs, or dev containers without internet
  access, where Claude Code cannot damage your host system."
- "Deny rules block in every mode, including `bypassPermissions`." Allow rules have no effect in it.
- Protected directories, writable only in bypass mode without a prompt: `.git`, `.config/git`, `.vscode`,
  `.idea`, `.husky`, `.cargo`, `.devcontainer`, `.yarn`, `.mvn`, `.claude` (except `.claude/worktrees`).
- "On Linux and macOS, Claude Code refuses to start in this mode when running as root or under `sudo`" …
  "The check is skipped automatically inside a recognized sandbox."
- "Administrators can block this mode by setting `permissions.disableBypassPermissionsMode` to
  `"disable"` in managed settings." A distributed product must therefore work without bypass mode.
- `bypassPermissions` set in a project's `.claude/settings.json` "doesn't take effect", so a repository
  cannot switch a session into bypass mode.
- A documented alternative for unattended runs: `claude -p … --permission-mode dontAsk --allowedTools …`;
  in `dontAsk` "Claude Code auto-denies every tool call that would otherwise prompt you".

**F-21** `verified-local` — `claude --help` (2.1.284) shows, in addition: `--tools <tools...>` ("Use ""
to disable all tools"), `--permission-prompts none` ("anything that would prompt is denied
automatically"), `--restricted` (ignores user, project and local settings files, confines file tools to
the working directories, "refuses bypassPermissions"), `--bare` (skips hooks, plugin sync, auto-memory,
keychain reads and `CLAUDE.md` auto-discovery; "Anthropic auth is strictly ANTHROPIC_API_KEY or
apiKeyHelper"), `--setting-sources`, `--strict-mcp-config`, `--safe-mode`, `--max-budget-usd`. R5 owns the
exact critic invocation; for the threat model the relevant fact is that a tool-less, settings-isolated
critic is expressible with documented flags. `--bare` excludes OAuth, so it is not available at Tier 1
with a subscription login.

**F-22** `verified-doc` — Claude Code's Bash sandbox, https://code.claude.com/docs/en/sandboxing (accessed
2026-09-29).

- It is a separate setting from the permission mode. The operating system enforces the boundary "for
  every Bash, PowerShell, or Monitor command and its child processes". `inferred` from that sentence and
  from the page's reference to separate Read and Edit permission rules: the built-in file tools are
  governed by permission rules, not by the OS sandbox.
- macOS uses Seatbelt; Linux and WSL2 need `bubblewrap` and `socat`. Native Windows is not supported.
- It can be enabled per invocation:
  `claude --settings '{"sandbox": {"enabled": true, "allowUnsandboxedCommands": false}}'`.
- "By default, if the sandbox cannot start because dependencies are missing or the platform is
  unsupported, Claude Code shows a warning and runs commands without sandboxing." `sandbox.failIfUnavailable`
  set to `true` makes that a hard failure.
- With `allowUnsandboxedCommands` false, "Claude Code ignores the `dangerouslyDisableSandbox` parameter".
- Network access goes through a proxy with `network.allowedDomains`.
- `sandbox.credentials` can deny credential files and unset or mask environment variables for sandboxed
  commands; it "affects sandboxed Bash commands only. To strip credentials from all subprocesses
  regardless of sandboxing, set `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`".
- Inside writable directories the sandbox still denies writes to `.claude` settings, skills, agents,
  commands and hooks, `.mcp.json`, shell startup files, and `hooks` and `config` inside `.git`.
- On Ubuntu 24.04 and later the default AppArmor policy prevents `bubblewrap` from creating user
  namespaces until a profile is added, so the sandbox may be unavailable on a stock consumer machine.

**F-23** `verified-doc` and `verified-local` — Codex. Documentation: `developers.openai.com/codex/sandbox`
answered with a 308 redirect to https://learn.chatgpt.com/docs/agent-approvals-security, which was read
(accessed 2026-09-29). The redirect target is a different host; R6 should confirm it is the canonical
location before pinning it.

- Modes: `read-only`, `workspace-write`, `danger-full-access`.
- In `workspace-write` network access is off unless `[sandbox_workspace_write] network_access = true`.
- `.git`, `.agents` and `.codex` stay read-only in `workspace-write`.
- Mechanism: Seatbelt (`sandbox-exec`) on macOS; `bwrap` plus `seccomp` on Linux.
- `--dangerously-bypass-approvals-and-sandbox` (alias `--yolo`): no sandbox and no approvals.
- `codex exec --help` (0.153.4): "Skip all confirmation prompts and execute commands without sandboxing.
  EXTREMELY DANGEROUS. Intended solely for running in environments that are externally sandboxed". It also
  lists `--dangerously-bypass-hook-trust`, `--skip-git-repo-check` and `--ephemeral`.

`inferred`: for Codex an unattended proposer does not need the bypass flag. `--sandbox workspace-write`
with `--ask-for-approval never` gives unattended execution inside an OS sandbox with the network off,
which is strictly safer than what the baseline passes (F-10). The cost is that package installs and other
network steps fail unless network access is enabled for that run.

**F-24** `verified-doc` — Gemini CLI, https://geminicli.com/docs/cli/sandbox/ and
https://geminicli.com/docs/reference/configuration/ (accessed 2026-09-29). Not installed here.

- Sandbox is enabled with `-s`/`--sandbox`, `GEMINI_SANDBOX=true|docker|podman|sandbox-exec|runsc|lxc`, or
  `"sandbox": true` in settings.
- Methods: macOS Seatbelt, Docker/Podman, a Windows native sandbox, gVisor (`runsc`), LXC/LXD
  (experimental).
- The default Seatbelt profile is `permissive-open`: writes confined to the project directory, network
  allowed.
- "YOLO mode (auto-approve all actions) can only be enabled via command line (`--yolo` or
  `--approval-mode=yolo`)", so a repository's settings file cannot switch it on. Settings accept
  `default`, `auto_edit` and `plan`.
- `unverified`: whether YOLO mode turns the sandbox on by default. The two pages read do not say.

**F-25** `verified-doc` — GitHub Copilot CLI,
https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-copilot-cli and
https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference (accessed
2026-09-29). Not installed here.

- `--allow-all-tools`: "Allows Copilot to use any tool without asking for your approval."
  `--allow-tool` and `--deny-tool` scope it.
- `--allow-all` / `--yolo`: "Enable all permissions (tools, paths, and URLs)."
- "You should only launch Copilot CLI from directories that you trust."
- Automatic approval "increases the risk of unintended actions being taken that might result in data loss
  or corruption, or other security issues", and the mitigation offered is external: "run Copilot CLI in a
  virtual machine, container, or dedicated system with tightly controlled permissions and network
  access".
- `unverified`: precedence between allow and deny flags; the pages read do not state it.

**F-26** `verified-doc` — opencode, https://opencode.ai/docs/permissions/ (accessed 2026-09-29). Not
installed here.

- Actions are `allow`, `ask`, `deny`. "Most permissions default to `"allow"`. `doom_loop` and
  `external_directory` default to `"ask"`."
- Reading `.env` files is denied by default (`*.env`, `*.env.*`), `*.env.example` allowed.
- `opencode run --auto` automatically approves "permission requests that are not explicitly denied".
- No OS sandbox is documented on that page. `inferred`: opencode is permissive by default, so an
  adapter must send an explicit permission configuration instead of relying on defaults.

**F-27** `verified-local` and `unverified` — pi 0.80.6. `pi --help` shows tool selection flags
(`--no-tools`, `--no-builtin-tools`, `--tools <allowlist>`, `--exclude-tools`), context flags
(`--no-extensions`, `--no-skills`, `--no-session`) and project trust (`--approve` "Trust project-local
files for this run", `--no-approve` "Ignore project-local files for this run"). It shows no permission
prompt mode and no sandbox flag. `unverified`: the project's statement of its permission philosophy;
the README fetched from the public repository contained no security section. `inferred`: pi as a proposer
has no vendor-side containment, so any containment must come from Specstride or the operating system;
pi as a critic can be made tool-less with `--no-tools --no-extensions --no-skills --no-approve`.

**F-28** `verified-local` — dsh 0.1.0-rc.8. `dsh --help` shows `--profile` and `--patch`; permissions are
set through `DSH_PERMISSION_MODE` (used at `proposer.sh:562`, `lib/critic.py:2158`) and tools are disabled
by a patch list. Tool-less operation depends on the patch naming **every** tool id
(`lib/critic.py:2104-2141`); a tool added by a later dsh version or a plugin is enabled until the list is
updated. This is a deny-list where an allow-list is needed. R9 owns the row.

### F. Supply chain

**F-29** `verified-doc` — npm. Accessed 2026-09-29.

- Provenance "provides a verifiable link to the package's source code and build instructions"; it needs
  npm 9.5.0 or later and a supported CI (GitHub Actions, GitLab CI/CD); consumers verify with
  `npm audit signatures`; it "does not guarantee the package has no malicious code".
  https://docs.npmjs.com/generating-provenance-statements
- Trusted publishing uses OIDC, "eliminating the need for long-lived npm tokens"; it needs npm 11.5.1 and
  Node 22.14.0 or later; provenance is generated automatically; the hardening option is "Require
  two-factor authentication and disallow tokens". https://docs.npmjs.com/trusted-publishers
- Lifecycle scripts `preinstall`, `install`, `postinstall` run on install, and npm's own advice is "You
  should almost never have to explicitly set a preinstall or install script".
  https://docs.npmjs.com/cli/v11/using-npm/scripts

---

## STRIDE threat model

Columns: **S**poofing, **T**ampering, **R**epudiation, **I**nformation disclosure, **D**enial of service,
**E**levation of privilege. Severity is impact × likelihood for an unattended run on a consumer's machine.
"Owner" is the feature that owns the mitigation. All rows are `inferred` from the findings cited.

### Gate and verdict (TB2 ↔ TB3 ↔ TB4)

| ID | STRIDE | Asset | Vector | Impact | Mitigation | Residual risk | Owner |
|---|---|---|---|---|---|---|---|
| T-01 | S | Verdict | A verdict line planted in evidence or in a grounded file | Approval without review | Keep as is: per-call CSPRNG nonce, verdict parsed only from the reply, full-line match, exactly one match, fail-safe `MALFORMED` (F-01). Raise the nonce to 128 bits; it costs nothing. One nonce per judge per call (F-09). | Negligible | 101 |
| T-02 | T, E | Approval state | Proposer creates `GATE<N>-APPROVED`, then ends the run; resume skips the phase (F-03) | Unreviewed work marked done; later phases build on it | (1) Control plane outside the proposer's write scope: approval records live in a runtime-owned directory that is not under the workspace and is not writable from the proposer's sandbox. (2) The approval is a record, not an empty file: phase, attempt, run id, nonce hash, critic identity, hash of the evidence and of the verification result, and an HMAC keyed with a per-run secret that lives only in runtime memory and the control directory. (3) Resume validates every record and cross-checks it against the verdict event; a marker without a valid record counts as unapproved and raises a `gate_integrity` event. | If the proposer is not sandboxed and the control directory is readable and writable by the same OS user, a determined proposer can still forge a record. The residual is removed only by OS-level isolation (T-07). | 101, 102, 100 (state layout) |
| T-03 | S, E | Critic judgment | Text in evidence, grounded files or spec context persuades the critic to approve (F-02) | Genuine nonce-bound approval of bad work | Deterministic verification gate runs before the critic and cannot be overridden by it (`required` mode as default where a plan exists). Critic diversity (decision 7). Data framing: every untrusted block is wrapped with a per-call random boundary token and the prompt states that text inside is data. Tool-less critic, so persuasion cannot cause side effects. | Material. Prompt injection has no complete defence; the residual is bounded by what deterministic checks cover. | 101, 105 |
| T-04 | S | Critic prompt structure | Evidence imitates a runtime banner such as the grounding snapshot (F-04) | Critic trusts forged "on-disk" facts | Per-call random boundary tokens on every section; strip or escape any occurrence of the boundary pattern in untrusted text; place runtime facts before untrusted text and repeat the verdict contract after it. | Low | 101 |
| T-05 | I | Nonce | Nonce written to disk or a span before the call returns (F-05) | With a critic that has tools, or with parallel roles, the nonce becomes readable by an untrusted party | Never persist or export the nonce until the call has returned. Store only a hash of the nonce in transcripts and spans. Debug prompt dumps replace the nonce with a placeholder. | Negligible | 101, 111 |
| T-06 | D | Run availability | Evidence induces duplicate or missing verdict lines; three `MALFORMED` halt the run (F-06) | Unattended run stops; no bad approval | Keep fail-safe. Distinguish "critic unreachable" from "critic replied malformed" in the stop reason. On a malformed reply, retry once with the untrusted blocks reduced to the grounding snapshot only before counting it. Report the halt as blocked-on-human. | Low; availability only | 101 |
| T-07 | E | Host system, credentials | Proposer with allow-all tools acts on injected instructions: reads keys, installs a persistence hook, pushes code, deletes files (F-10, F-20) | Full compromise of the consumer's account on that machine | See §R-2 (sandbox ladder). Summary: default to the vendor's OS sandbox where one exists; refuse the bypass flag outside a detected container unless the consumer opts in explicitly in **user** config; scrub the environment; network off or allow-listed; never auto-assert `IS_SANDBOX`. | Material on harnesses with no sandbox (F-25 to F-27) and on hosts where the sandbox is unavailable (F-22). The doctor states it. | 103, 109, 112 |
| T-08 | T, E | Proposer session | Injected critic reply relayed through the feedback file into the next proposer attempt (F-07) | Second-order injection into a session with tools | Feedback is framed as data with a boundary token; the runtime extracts only the criterion ids and the text after them, capped in size; the verdict line is removed. | Low to medium | 101, 103 |

### Host skill and comment (consumer ↔ TB1 ↔ TB2)

| ID | STRIDE | Asset | Vector | Impact | Mitigation | Residual risk | Owner |
|---|---|---|---|---|---|---|---|
| T-09 | S | Consumer intent | Repository text makes the host model invent or alter "the consumer's comment" | Run steered by an attacker, recorded as the consumer's wish | The comment is passed to the runtime verbatim as a CLI argument captured from the skill invocation, stored with its hash before the host model reads any repository file. The digest shows the verbatim comment next to "what changed because of it", so a mismatch is visible. | Medium: the host model still interprets it. Bounded by T-10. | 113, 107 |
| T-10 | E | Launch checks, terms gate, budgets | A comment, genuine or laundered, read as permission to skip a check | Gate or budget bypass | Enforcement lives in the runtime. The CLI has no flag that disables a launch check, the terms gate or a budget cap; the comment can only select among options the contract validator accepts (fewer features, lower budget, `dry-run`). Anything that widens scope or spend needs an explicit flag or config key set by the consumer, never inferred from text. | Low | 107, 110 |
| T-11 | R | Audit trail | Host model summarises a run inaccurately | Consumer trusts a wrong report | The digest line is produced by the runtime from events, not composed by the host model; the skill prints it verbatim. | Low | 107, 113 |
| T-12 | E | Host session | Runtime or harness output printed into the host context contains instructions | Host model injected through status text | Command output is terse and structured (decision 16); free text from untrusted sources (critic feedback, test names, harness messages) is never echoed into default output, only referenced by path. | Low to medium | 113, 107 |

### Adapters and discovery (TB2 ↔ TB3a/TB3b ↔ TB10)

| ID | STRIDE | Asset | Vector | Impact | Mitigation | Residual risk | Owner |
|---|---|---|---|---|---|---|---|
| T-13 | E, T | Consumer's machine | Project-scope `specstride.yaml` declares a harness descriptor, a critic, a verification command, a hook or an endpoint; cloning a repository and running the skill executes it | Arbitrary code execution, or a critic the attacker controls | **Config trust tiers.** Keys that widen capability are honoured only from user config, env or CLI flags: harness descriptors and their command lines, endpoint URLs, secret references, the critic selection, sandbox level, permission flags, budget increases, hook commands, telemetry endpoints, content capture. Project config may only narrow (lower budgets, fewer phases, stricter mode, micro-loops off). A project key of the first kind is ignored with a doctor warning and a launch message. | Low. Costs convenience: a team cannot ship a harness definition inside the repository. A signed or explicitly trusted project file is a possible later addition. | 110, 109, 112 |
| T-14 | S | Critic role | A discovered harness claims "tool-less critic, different provider" falsely and is auto-picked (decision 17) | Critic with tools, or the same model under another name, or an attacker-run endpoint judging every gate | Auto-pick only harnesses whose tool-less mode the runtime **enforces through flags it passes and verifies by probe**; a declared capability alone does not qualify. The probe is free: a canary file and a prompt-less or dry invocation where the harness supports one; otherwise the harness is not auto-picked and the consumer may still configure it explicitly. The pick is announced, recorded and shown by the doctor (already decided). Provider identity comes from the endpoint host, not from the descriptor's label. | Medium for unverified harnesses; decision 17's "tested before unverified" ordering keeps it rare. | 109, 112 |
| T-15 | S | Harness binary | PATH shadowing: a binary named like a known harness earlier on PATH, or inside the workspace | Code execution as the consumer; stream spoofing | Resolve to an absolute path at launch, record it and its version in the run record, refuse paths inside the workspace or a world-writable directory, warn when the path changed since the last run. | Low | 109, 112 |
| T-16 | I | Prompts, API keys | Descriptor or config points an OpenAI-compatible endpoint at an attacker's URL | Source code and a provider key sent off-host | Endpoint URLs only from user scope (T-13). A key reference is bound to a host: the runtime sends a secret only to the host it was declared for. Plain `http://` is refused except for loopback. The doctor lists every endpoint a run will contact. | Low | 110, 109 |
| T-17 | T, S | Stream parsing | A harness, or tool output echoed inside its stream, emits lines that imitate terminal records, cost figures or tool events | False telemetry; a pass wrongly seen as finished | Parse only the harness's own framing (one JSON document per line from the harness's stdout); never interpret tool output as stream records; `missing_terminal` stays (Principle XI); unknown values stay `null`. Size and rate caps per line. | Low | 109, 111 |
| T-18 | D | Budget | A discovered harness with unknown cost reporting spends without being counted | Budget cap ineffective | Already covered by decision 8 in principle; for an unverified harness the budget is wall-clock and pass-count based and the doctor says that spend is not measurable. | Medium | 110 |

### Micro-loop layer (decision 21) — threats only; R23 designs the rules

| ID | STRIDE | Asset | Vector | Impact | Mitigation direction | Residual risk | Owner |
|---|---|---|---|---|---|---|---|
| T-19 | T | Check definitions | Proposer edits the check command list, the test runner config, a `package.json` script, a `Makefile` target, `conftest.py`, a lint config or CI file that the check reads | Check passes without the work being right | The check set is fixed and hashed before the attempt starts and stored in the control plane. The files a check depends on are declared or derived, fingerprinted at the same time, and compared before every check and again before the gate; a change is reported as evidence to the critic and fails the inner check. Where the OS sandbox allows it, those paths are read-only to the proposer. | Medium. Indirect dependencies (a helper imported by a test) cannot be listed completely. The full verification gate and the critic remain the backstop, and they share the weakness. | 115, 105 |
| T-20 | T | Tests | Proposer weakens, skips or deletes tests it is measured by; adds `skip` markers; changes the expected values | False green | Test files that existed at attempt start are fingerprinted; deletions and modifications of them are listed for the critic as facts. Test counts before and after are compared. New tests are allowed. | Medium: a legitimate task may need to change a test, so this is reported, not blocked. | 115, 101 |
| T-21 | E | Runtime | The check command runs repository code (tests) as the runtime's user, with the runtime's environment | A test planted by injected work reads the runtime's secrets or the control plane | Checks run with a scrubbed environment, no provider keys, the same sandbox level as the proposer or stricter, a working directory inside the workspace, no write access to the control plane, a timeout and a process group. Fixed argv, no shell (as `lib/verification_plan.py:1572-1579` does today). | Low to medium | 115, 105 |
| T-22 | S | Verdict | An inner result is mistaken for, or promoted to, a verdict | Approval without the critic | A8 rules G1 and G5, already fixed by decision 21. Inner results use a different record type that the gate parser cannot read. Tripwire in decision 21 applies. | Low | 115, 101 |
| T-23 | I, T | Critic independence | Repair history reaches the critic through files the proposer writes into the workspace (notes, a progress file, commit messages) | Critic anchored by the proposer's narrative | Runtime-written micro records stay in the control plane. Proposer-written notes cannot be prevented, so the critic prompt says such files are claims; grounding excludes the runtime's own state paths. | Medium | 115, 101 |
| T-24 | T | Check result evidence | Proposer overwrites the final check result the critic will see | Critic sees a forged pass | The result is written by the runtime into the control plane and handed to the critic by the runtime, never read back from the workspace. | Low | 115 |
| T-25 | D | Caps | Check output crafted to be huge, or a check that never ends | Disk or time exhaustion | Output cap, timeout, process-group kill, fail-fast (aim 1). | Low | 115 |

### State files, PID and lock (TB5)

| ID | STRIDE | Asset | Vector | Impact | Mitigation | Residual risk | Owner |
|---|---|---|---|---|---|---|---|
| T-26 | T, E | Other processes | PID file rewritten to point at an unrelated process; `stop` or relaunch cleanup kills it (F-18) | Denial of service against the consumer's own processes | PID record in the control plane, not the workspace. Each record carries PID, process start time and a random run token that the process also holds in its environment or command line; a signal is sent only when all three match (start time from `/proc/<pid>/stat` on Linux and from the process table on macOS). Signals go to the process group the runtime created. | Low | 102, 107 |
| T-27 | D | Run availability | Stale or planted lock blocks every run (F-19) | Runs refuse to start | Kernel advisory lock held by the live process as the only source of truth; the lock file's content is informational. No directory-based fallback. The doctor reports a lock file with no holder as stale and offers removal. | Low | 102, 112 |
| T-28 | T | Run control | Proposer writes `stop.flag`, a resume settings file or a run-state file | Run ended or reconfigured by the proposer; on resume, settings replay applies attacker values | All control inputs live in the control plane. Settings replayed on resume are validated against the config schema and the trust tiers of T-13 again. Stop requests carry the run token. | Low once the control plane is outside the write scope | 102 |
| T-29 | I | State directory | Control plane or logs readable by other local users | Prompts, source excerpts and any unredacted secret exposed | Directories created `0700`, files `0600`; the doctor checks. | Low | 102, 112 |
| T-30 | T | State files | Symlink or path traversal: a state path or a cited evidence path resolves outside its root | Runtime reads or overwrites a file elsewhere | Resolve real paths and require them to stay inside their root; refuse symlinks in the control plane; open with no-follow where available. The baseline already refuses citations that escape the workdir (`lib/critic.py:830`). | Low | 100, 101 |
| T-31 | R | Audit trail | Event log edited or truncated by the proposer | No reliable record of what happened | Event log in the control plane, append-only by convention, each record carrying a sequence number and the hash of the previous record. | Low; this detects, it does not prevent | 111 |

### Observability and secrets (TB6)

| ID | STRIDE | Asset | Vector | Impact | Mitigation | Residual risk | Owner |
|---|---|---|---|---|---|---|---|
| T-32 | I | Secrets, source code | Prompts, replies and tool arguments exported on spans to a remote collector (F-13) | Secrets and proprietary code leave the host | Content capture is a separate switch, **off by default**, independent of "traces on". With it off, spans carry path, hash and size only. With it on, content is redacted and capped, fail-closed. The doctor shows the collector endpoint and whether content capture is on. | Medium when on: pattern redaction misses secrets (F-12). | 111, 112 |
| T-33 | I | Secrets | Secret printed by a tool (an env dump, a failing test that logs a connection string) enters the event log, evidence, transcripts, digest or kanban | Secret at rest in several files, possibly committed | One redaction function at the single point where untrusted text enters the event pipeline (§R-3). Exact-match scrubbing of every secret value the runtime itself resolved. Evidence and transcripts are scanned at write time and before any git commit the runtime makes; a hit blocks the commit and raises an event. | Medium: unknown formats pass. | 111, 110, 102 |
| T-34 | I | Provider credentials | Proposer inherits the whole environment (F-11) | Any key in the consumer's shell is readable by the harness and by injected instructions | Environment allow-list per adapter: the harness gets `PATH`, locale, `HOME` (or an overlay), its own auth variables and nothing else. Critic credentials are never in the proposer's environment and the reverse. | Low for env; files in `HOME` remain readable at Tier 1 unless the sandbox denies them. | 109, 110 |
| T-35 | I | Secrets in config | A secret written inline in a config file, or passed on a command line visible in the process list | Secret at rest in a file that may be committed; visible to other users | Decision 6 as written: only `env:`, `file:` or keychain references; an inline value is a config error and the doctor's inline-secret check reports it. Secrets reach a harness through environment or stdin, never argv. `file:` targets must be outside the workspace and not group or world readable. | Low | 110, 112 |
| T-36 | I, T | Telemetry endpoint | Collector URL set from project config or changed by the proposer | Telemetry redirected to an attacker | Telemetry endpoints are user-scope keys (T-13). | Low | 111, 110 |
| T-37 | D | Run | Exporter blocks or fails | Run stalls | Principle V as is: best effort, local first, never blocks the loop. | Low | 111 |

### Kanban and UI (TB8)

| ID | STRIDE | Asset | Vector | Impact | Mitigation | Residual risk | Owner |
|---|---|---|---|---|---|---|---|
| T-38 | I, E | Run state, control | A web page in the consumer's browser reaches the local UI server (cross-origin request or DNS rebinding) (F-16, F-17) | Run data read by a remote site; with write routes, runs controlled by it | Bind loopback only; a random port; a per-session token delivered in the URL fragment the plugin opens and then required on every request including event streams; validate `Host` against the loopback names and `Origin` against the server's own origin; no wildcard CORS. **Read-only by default**: the Wave 2 UI has no route that changes a run. | Low | 121, 111 |
| T-39 | I | Run state | Other local users connect to the loopback port | Disclosure on shared machines | The token above; where the platform allows, a Unix domain socket with `0600` instead of TCP for non-browser clients. | Low | 121 |
| T-40 | E | Browser session | Stored cross-site scripting: task titles, feedback, file names or harness messages rendered as HTML | Script runs in the UI origin and can call its API | Render all run-derived text as text; a strict content security policy with no inline script; no `dangerouslySetInnerHTML` equivalent for run data. | Low | 121 |
| T-41 | I | Run data | An exported page (for example a hosted artifact) carries prompts, paths or secrets off-host | Disclosure to a third-party service | The export uses the same redacted projection as telemetry with content capture off; it is an explicit consumer action, never automatic. R13 owns the surface. | Low to medium | 121, 111 |
| T-42 | D | Host | The UI server outlives the run | Orphan listener | The server's lifetime is tied to a PID record with the same identity rules as T-26; idle timeout. | Low | 121 |

### Supply chain and distribution (TB9)

| ID | STRIDE | Asset | Vector | Impact | Mitigation | Residual risk | Owner |
|---|---|---|---|---|---|---|---|
| T-43 | T, E | Every consumer | Compromised publisher account or token; a malicious version published | Code execution on every machine that updates | Trusted publishing through OIDC with tokens disallowed and two-factor required; provenance attestations; releases only from CI on a protected branch (F-29). | Low to medium | 100, 113 |
| T-44 | T, E | Every consumer | A compromised transitive dependency, or an install script in one | Same | Few runtime dependencies; exact versions and a committed lockfile; **no install scripts in Specstride's own packages**; the product works when installed with scripts ignored; native components (decision 2) ship as prebuilt optional packages per platform, not compiled at install; `npm audit signatures` in CI; dependency updates reviewed. Licence check for MIT compatibility is R1's. | Medium: inherent to the ecosystem. | 100, 113 |
| T-45 | S | Consumers | Typosquatted package or plugin name | Consumer installs an impostor | Reserve the package scope and obvious variants; the documentation and the plugin name the exact package; the plugin verifies the version of the CLI it drives. | Low | 113 |
| T-46 | T | Plugin ↔ CLI | The thin plugin installs or updates the CLI on first run without the consumer noticing | Unreviewed code execution; version drift | The plugin never installs silently: it detects, reports the missing or mismatched version through the doctor, and prints the install command. R3 owns packaging. | Low | 113, 112 |
| T-47 | T | Generated launch bundle | The rendered bundle is edited between render and launch | Run executes altered code or contract | Keep the content hash binding from 011 FR-007 and FR-009; the runtime verifies the bundle hash at launch and at every relaunch. | Low | 107 |

---

## Version/date pins

| Item | Version or date | How pinned |
|---|---|---|
| Specstride baseline | `9cab15d` | `git rev-parse HEAD` in `/root/specstride` |
| OTel prompt work | `936afea` (one commit past `9cab15d`) | `git log --oneline -3` in `/root/specstride-otel-prompts` |
| mixture-of-loops baseline | `9c88f86` | `git grep … 9c88f86` |
| Lisa tree read | branch `feat/dashboard-trajectory-redesign` as checked out | `git rev-parse --abbrev-ref HEAD`; R1 rules on the tree |
| Constitution | v2.0.3, amended 2026-09-27 | file footer |
| `claude` | 2.1.284 | `claude --version` |
| `codex` | codex-cli 0.153.4 | `codex --version` |
| `pi` | 0.80.6 | `pi --version` |
| `dsh` | 0.1.0-rc.8 | `dsh --version` |
| Claude Code docs (permission modes, sandboxing) | accessed 2026-09-29 | URLs in F-20, F-22 |
| Codex approvals and security doc | accessed 2026-09-29, reached by redirect | URL in F-23 |
| Gemini CLI, Copilot CLI, opencode docs | accessed 2026-09-29 | URLs in F-24 to F-26 |
| npm docs, OpenTelemetry docs, MCP specification 2025-06-18 | accessed 2026-09-29 | URLs in F-14, F-17, F-29 |

---

## Options compared

### O-1. Where approval state lives (T-02)

| Option | Forgery by the proposer | Principle I (files, no watcher) | Parity oracle | Cost |
|---|---|---|---|---|
| A. Empty marker in the workspace (today) | Trivial | Yes | Identical | None |
| B. Marker in the workspace plus a signed record in the control plane; resume trusts the record | Needs write access to the control plane and the run key | Yes | Marker path is `translated`; the record is a new surface with a register row | Small |
| C. Record only, in the control plane, outside the workspace | Same as B | Yes | Marker path `translated` through the mapping | Small; host tools that look for the marker must use `status` |
| D. B or C plus OS sandbox that denies the proposer the control plane | Not possible from inside the sandbox | Yes | Same as B or C | Depends on the harness (§R-2) |

Recommended: **C with D wherever a sandbox exists**, and the compatibility projection (already proposed
in §2 of the prompt for events) may also project a marker file for tools that expect one, clearly
non-authoritative.

### O-2. Proposer containment

| Option | Protection | Works at Tier 1 (subscription login) | Works on every harness | Consumer setup | Evolvability |
|---|---|---|---|---|---|
| A. Vendor allow-all flag, no sandbox (today) | None | Yes | Yes | None | — |
| B. Vendor permission allow-list without bypass (`dontAsk` plus allowed tools; Codex `workspace-write`, approvals never) | Tool-level, plus OS-level for Codex | Yes | No: only where the vendor offers it | None to small | Per-adapter capability |
| C. Vendor OS sandbox switched on by the adapter (Claude Bash sandbox, Codex sandbox, Gemini sandbox) | OS-level for shell commands; network off or allow-listed | Yes | No | Linux may need packages (F-22) | Per-adapter capability |
| D. Specstride-provided wrapper (bubblewrap on Linux, Seatbelt on macOS) around any harness | OS-level for the whole harness process | Partly: the harness needs its own login files readable and the provider reachable | Yes in principle | Same dependencies as C; a second implementation to maintain | One seam for all harnesses, which is the evolvable shape |
| E. Container or VM supplied by the consumer | Strongest | Login must be available inside | Yes | High | Outside the product |

Recommended: a **containment level** as an adapter capability, with B and C in Wave 1 for Claude, D as
the generic level for discovered harnesses on the roadmap, and E detected and honoured. See §R-2.

### O-3. Prompt content in telemetry

| Option | Debug value | Leak risk | Notes |
|---|---|---|---|
| A. Content whenever traces are on (today's OTel prompt work) | High | High | F-13 |
| B. References only (path, hash, size), content local | Medium | Low | The local file is still protected by T-29 |
| C. B by default, content opt-in, redacted, capped, user scope only | High when needed | Medium when on | Recommended |

---

## Recommendation

**One recommendation: adopt the threat model above as feature 100's threat model, built on five
structural controls. Confidence: high for R-1, R-3, R-4, R-5; medium for R-2, because what is achievable
depends on each harness and on R5, R6, R9 and R20.**

### R-1. Separate the control plane from the workspace

Everything the runtime relies on to decide something — approval records, verdict records, the lock, PID
records, stop requests, resume settings, the fixed check set and its fingerprints, inner check results,
the event log — lives in a runtime-owned directory that is outside the proposer's write scope. The
workspace holds only what the proposer produces. Approval is a signed record bound to the hash of the
evidence and the verification result, and resume validates it (T-02). This keeps Principle I: coordination
is still by files, and nothing watches.

Cost: paths named literally in 028 requirements move, which decision 3 and the `translated` disposition
already allow. The evidence file stays in the workspace because the proposer writes it.

### R-2. Containment levels as an adapter capability

| Level | Meaning | Examples today |
|---|---|---|
| C0 | No containment. The harness runs with all tools as the consumer. | Any harness with only an allow-all flag; pi; a discovered harness with no declared sandbox |
| C1 | Tool-level restriction enforced by the harness: no bypass flag, an allow-list, project settings ignored | Claude `--permission-mode dontAsk` with `--allowedTools`, or `--restricted`; opencode with an explicit permission config |
| C2 | OS sandbox for commands, network off or allow-listed, control plane and credential paths denied | Claude Bash sandbox with `allowUnsandboxedCommands: false` and `failIfUnavailable: true`; Codex `workspace-write`; Gemini `--sandbox` |
| C3 | The whole run inside a container or VM | Consumer-supplied; detected |

Rules:

1. Each adapter declares the highest level it can enforce; the runtime picks the highest available and
   announces it at launch, in events, in the digest and in the doctor, in the same way the loop strategy
   is announced.
2. The default for a tested adapter is C2 where the platform supports it and C1 otherwise. C0 requires an
   explicit key in **user** config. A discovered harness runs at the level its descriptor can be shown to
   enforce, and the doctor says "unverified, containment C0" when that is none.
3. The runtime never sets `IS_SANDBOX` or an equivalent assertion by itself. Inside a detected container
   the vendor's own detection applies.
4. Principle VIII is reworded from "throwaway config home" to the property it was protecting: the pass
   cannot change the operator's configuration and leaves nothing behind. At Tier 1 that is met by denying
   writes to the harness's config home rather than by replacing it.
5. The environment passed to any harness is an allow-list (T-34).
6. The critic is always tool-less, enforced by flags the adapter passes and checked by a probe. A critic
   path that cannot be made tool-less is not offered for auto-pick and is refused unless the consumer
   configures it explicitly, with a doctor warning. No critic path ever receives an allow-all flag.

### R-3. Redaction rules and secret references

1. Secrets in config are references only: `env:NAME`, `file:/absolute/path`, `keychain:service/account`
   (decision 6). An inline value is a config error.
2. A reference is resolved at the moment of use, held in memory, handed to a harness through its
   environment or stdin, never through argv, never written to state, events, logs or the contract.
3. Every resolved secret value is registered with the redactor, which replaces exact occurrences in any
   text that enters the event pipeline. This catches secrets that pattern rules cannot recognise.
4. Pattern rules extend the baseline set (F-12): key names matched as a suffix or substring
   (`*_token`, `*_key`, `*_secret`, `*password*`), and value patterns for private-key blocks, JWTs,
   cloud access key ids, URLs with embedded credentials and common provider key prefixes. The pattern set
   is versioned data, not code, so it can be updated without a core change.
5. Redaction happens once, where untrusted text enters (the stream adapter, check output capture, critic
   reply capture), and the redacted form is what every sink receives: event log, OTel, digest, kanban,
   status.
6. Redaction is fail-closed: if it cannot run, content is dropped and the metadata says so (kept from
   `936afea`).
7. Prompt and reply content in telemetry is off by default and is a user-scope switch (O-3).
8. Evidence, transcripts and the feedback file are local artefacts and keep full text, protected by file
   permissions; they are scanned for registered secrets and patterns before the runtime commits anything
   to git, and a hit blocks the commit.
9. The nonce is never exported before the call returns; afterwards only its hash is.
10. The consumer's comment passes through the same redactor before it is recorded.

### R-4. Config trust tiers

Project-scope configuration and any file inside the repository may narrow a run and may not widen it.
Harness descriptors, endpoints, secret references, critic choice, containment level, permission flags,
hook commands, telemetry endpoints, content capture and budget increases are honoured only from user
config, environment or CLI flags (T-13). Decision 9's precedence order stays as written; the tiers are a
filter on **which keys** each layer may set, not a change to the order.

### R-5. Untrusted text is data everywhere

Evidence, grounded excerpts, spec context, critic feedback, check output, harness messages and the
comment are wrapped in per-call random boundaries when they enter a prompt, are never echoed into the
host session by default, are rendered as text in the UI, and are never parsed for control records.

### Proposed wording for feature 100's threat-model requirements (input for Stage B)

- The runtime accepts an approval only from a record it wrote itself, bound to the evidence hash and
  verifiable on resume.
- No component outside the runtime can create, change or remove control state.
- Every run records its containment level, critic tool-less verification result, and redaction policy
  version.
- No secret value appears in any event, span, digest line, status output or UI payload; a test plants
  canary secrets in tool output, evidence, check output and the comment and asserts their absence in
  every sink.
- The UI server refuses any request without the session token, or with a foreign `Origin` or `Host`.
- Installing the package runs no install script.

---

## Matrix rows

R11 contributes one security column's worth of facts per harness, for the owners of each row (R5, R6,
R7, R9, R10, R20) to merge. It does not own the rows. Columns outside security are left to those owners.

| Harness | Allow-all flag | What it removes | Vendor OS sandbox | Unattended without bypass | Tool-less critic mechanism | Containment ceiling | Tag |
|---|---|---|---|---|---|---|---|
| Claude Code 2.1.284 | `--dangerously-skip-permissions` / `--permission-mode bypassPermissions` | All prompts and safety checks, including protected-path writes; deny rules still apply; refused as root outside a recognized sandbox; can be disabled by managed settings | Bash sandbox (Seatbelt; bubblewrap + socat), separate setting, can fail open unless `failIfUnavailable` | `--permission-mode dontAsk` + `--allowedTools`; `--permission-prompts none`; `--restricted` | `--tools ""`; HTTP API call | C2 | `verified-doc` F-20, F-22; `verified-local` F-21 |
| Codex 0.153.4 | `--dangerously-bypass-approvals-and-sandbox` / `--yolo` | Sandbox and approvals together | Seatbelt; bwrap + seccomp; network off by default in `workspace-write`; `.git`, `.agents`, `.codex` read-only | `--sandbox workspace-write` with approvals `never` | `--sandbox read-only`; HTTP API call | C2 | `verified-doc` and `verified-local` F-23 |
| Gemini CLI | `--yolo` / `--approval-mode=yolo` (command line only) | Approval of all actions | Optional: Seatbelt, Docker/Podman, gVisor, LXC; default macOS profile allows network | `unverified` | `tools.core` allow-list / `plan` mode; `unverified` for headless | C2 when the sandbox is enabled | `verified-doc` F-24 |
| Copilot CLI | `--allow-all-tools`; `--allow-all` / `--yolo` | Tool approval; with `--allow-all` also path and URL limits | None documented; vendor advises a VM or container | `--allow-tool` / `--deny-tool` lists | `unverified` | C1 | `verified-doc` F-25 |
| opencode | Permissive defaults; `opencode run --auto` | Approval of everything not denied | None documented | Explicit `permission` config | `permission` config with every tool denied; `unverified` in practice | C1 | `verified-doc` F-26 |
| pi 0.80.6 | None: no permission prompts | — | None | Runs unattended by design | `--no-tools --no-extensions --no-skills --no-approve` | C0 as proposer | `verified-local` F-27 |
| dsh 0.1.0-rc.8 | `DSH_PERMISSION_MODE` (baseline default `workspace-write`) | Set by mode | `unverified` | Yes | Patch disabling each tool id plus `read-only` mode; a deny-list | `unverified`; R9 | `verified-local` F-28 |
| Generic discovered harness | Whatever the descriptor declares | Unknown | Unknown | Unknown | Only if enforced by flags and confirmed by probe | C0 until shown otherwise | `inferred` |

Host matrix: none.

---

## Open questions / risks

1. **DECISIONS-PENDING — default containment and the bypass flag.** Evidence: the vendor states bypass
   mode "offers no protection against prompt injection" and is for isolated environments only (F-20);
   the baseline passes it on every pass and asserts `IS_SANDBOX=1` when run as root (F-10); managed
   settings can disable it, which would break a product that depends on it. Default to proceed on:
   containment level C2 where available, C1 otherwise, C0 only by explicit user-scope opt-in. If the
   owner rules for today's behaviour as default: every Wave 1 run is C0, T-07 stays at its highest
   severity, and the public release needs a prominent warning. This does not contradict a numbered
   decision; it fills a gap that decisions 5 and 19 make urgent. It does change parity behaviour (the
   flags passed to the harness), so it needs a divergence register row.

2. **DECISIONS-PENDING — project-scope configuration may only narrow (R-4).** Evidence: decision 9 places
   project `specstride.yaml` above user config, and decision 17 lets config declare a harness, which is a
   command line; together they let a cloned repository execute a command when the skill is invoked
   (T-13). Default to proceed on: decision 9's order as written, with capability-widening keys honoured
   only from user scope, env or flags. If the owner rules otherwise: project files can define harnesses
   and critics, and the product needs a trust prompt per repository, as several harnesses have.

3. **DECISIONS-PENDING — approval record replaces the bare marker (R-1, T-02).** Evidence: F-03. Default
   to proceed on: signed record in the control plane; the marker path is `translated`. If the owner rules
   for the marker as the source of truth, automatic relaunch (aim 3) inherits the forgery path.

4. **Prompt injection has no complete defence.** T-03 remains material. The deterministic verification
   gate is the only control an injected critic cannot talk past, so its coverage bounds gate quality.
   R23 and 105 should treat "what share of acceptance criteria has a deterministic check" as a measured
   quantity.

5. **Check-input tampering cannot be closed completely** (T-19, T-20). R23 designs the rules and R23v
   red-teams them; the residual is indirect dependencies of a check.

6. **Sandbox availability on stock Linux.** Ubuntu 24.04 and later block unprivileged user namespaces by
   default (F-22), so C2 may be unavailable until the consumer adds a profile. The doctor must test it,
   and the fallback level must be announced, never silent.

7. **Tier 1 and containment pull against each other.** A subscription login lives in the harness's config
   home, which a sandboxed proposer must still be able to read and, for token refresh, write. R5 and R8
   should confirm per harness whether a read-only config home works across a run that lasts hours.

8. **Unverified items**: GenAI semantic conventions on content capture (F-15); whether Gemini's YOLO mode
   enables its sandbox (F-24); Copilot allow/deny precedence (F-25); pi's documented security stance
   (F-27); dsh's permission modes beyond the two seen in code (F-28); the canonical home of the Codex
   security documentation after the redirect (F-23).

9. **Memory and learning as an injection store.** If R12's recommendation carries model-written text
   across runs or projects, that text is a persistent injection channel and needs the same data framing
   and a provenance field. R12 owns the decision; this report flags the threat.

10. **Parallel execution** (R26) would invalidate the assumption behind F-05 that no proposer runs while
    a critic call is in flight. If any parallelism enters Wave 1, T-05's mitigation becomes mandatory
    rather than hygiene.
