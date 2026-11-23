# Argument table of the Claude harness adapter

The exact flags of the harness, with their version pin. `spec.md` describes behaviour and names none of
them except where the baseline's own argument list is the behaviour that parity binds (F125-FR-009).

Pin: `claude` 2.1.284, floor 2.1.259. Checked by `claude --help` on 2026-09-29 (introspection only; no
login, no model call). "help" means the flag is listed by the help of the pinned version; "doc" means it
is documented and not listed (a hidden flag); "unverified combination" means no live call has run it.

## Proposer, profile `parity` (the as-is list, F125-FR-009)

Order is fixed. Stdin carries the prompt (F125-FR-007).

| # | Argument | When | Source |
|---|---|---|---|
| 1 | `-p` | always | B-0689 |
| 2 | `--dangerously-skip-permissions` | always | B-0689, B-0740 |
| 3 | `--verbose` | always | B-0689, B-0740 |
| 4 | `--disable-slash-commands` | unless `harnesses.claude.proposerSkills` is `1` | B-0534, B-0741 |
| 5 | `--output-format stream-json` | when the stream tap or the JSON output is on | B-0742 |
| 6 | `--model <M>` | when a model is set | B-0689 |

Environment names the stub sees under `parity`: the allow-list of F125-FR-020 plus `SPECSTRIDE_STDIN_FILE`
(F125-FR-007). Nothing about memory, session, sandbox, overlay or trace parent.

## Proposer, default profile at auth tier 1 (F125-FR-012 to F125-FR-018)

| Argument | Meaning | State of the flag at the pin |
|---|---|---|
| `-p` | Headless | help |
| `--output-format stream-json` and `--verbose` | Streamed NDJSON; the stream needs the verbose flag | help |
| `--model <M>`, `--effort <level>` | Model and effort of the call (F125-FR-033); levels `low`, `medium`, `high`, `xhigh`, `max` | help |
| `--permission-mode acceptEdits` | Accept-edits mode (F125-FR-012) | help |
| `--allowedTools <list>` | The allow list; it approves and does not restrict, so the tool set is also stated | help |
| `--permission-prompts none` | Nothing waits for a human | help |
| `--safe-mode` | Customisations off: instruction files, skills, plugins, hooks, tool servers, agents, auto memory. Administrator-managed settings still apply | help |
| `--strict-mcp-config` | No tool server from any configuration | help |
| `--disable-slash-commands` | Skills off, as at the baseline | help |
| `--session-id <uuid>` | First pass of a phase attempt (F125-FR-013); at auth tier 1 every pass, since each is fresh | help |
| `--no-session-persistence` | At auth tier 1: no session state is persisted, so the real configuration home gets none (F125-FR-014) | help; `unverified` for a proposer pass until capture E |
| `--resume <uuid>` | Later pass in the same phase attempt, where continuation is in force: not at auth tier 1 until capture E (F125-FR-014); never with an empty value; never `--continue` | help |
| `--settings '{"sandbox": {"enabled": true, "allowUnsandboxedCommands": false, "failIfUnavailable": true}}'` | The sandbox for commands, at containment C2 (F125-FR-019) | help for the flag; the sandbox setting is doc only |
| `--dangerously-skip-permissions` | Only when the consumer set the bypass mode in `sandbox.permissionMode` in user configuration, and then only with a detected sandbox and a user other than root; never selected by the harness adapter (F125-FR-012, CQ-183) | help |

The variadic flags (`--allowedTools`, `--tools`, `--disallowedTools`) swallow a positional prompt that
follows them. The prompt goes on standard input (F125-FR-004), so the case does not arise.

Environment additions, each behind its switch:

| Variable | Meaning | Switch |
|---|---|---|
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` | Native memory off (F125-FR-018) | `memory.native.proposer` off |
| `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` | Credentials removed from the environment of tool commands (F125-FR-020) | `harnesses.claude.subprocessEnvScrub` |
| `TRACEPARENT` | The trace parent of the pass (F125-FR-020) | always, except under `parity` |
| `CLAUDE_CONFIG_DIR` | The throwaway home, at auth tier 2 only (F125-FR-017) | never at auth tier 1 |

All of the above is `unverified` as a combination: one logged live call per role (task T076, paid) runs it.
Documentation-only items: the sandbox setting, the environment variables, the effort levels' effect.

## Critic at auth tier 1 (F125-FR-023 to F125-FR-027)

Started in an empty temporary directory. Prompt on stdin.

| Argument | Meaning | State |
|---|---|---|
| `-p --output-format stream-json --verbose` | Headless, streamed | help |
| `--model <critic model>` | The model that the role plan names; by default a model tier different from the proposer's (F125-FR-026) | help |
| `--tools ""` | No built-in tool | help |
| `--disallowedTools "mcp__*"` | No tool-server tool | help |
| `--strict-mcp-config` | No tool server from any configuration | help |
| `--safe-mode` | Customisations off | help |
| `--disable-slash-commands` | Skills off | help |
| `--session-id <minted uuid>` | The session id the proof compares against | help |
| `--no-session-persistence` | Nothing written, nothing resumable | help |
| `--max-budget-usd <n>` | Per-call cap; set after the probe (CQ-146) | help; the cap under a subscription is inferred |
| `--max-turns 1` | One turn | doc (hidden flag); gated by the version floor |
| `--permission-mode dontAsk --permission-prompts none` | Deny, never ask | help |
| `--system-prompt-file <file>` | The critic's system prompt, if feature 117 supplies one | doc (hidden flag) |

Never: `--resume`, `--continue`, `--fork-session`, `--bare`, `--dangerously-skip-permissions`,
`--fallback-model` (the critic invocation type has no parameter for them).

The environment is the allow-list with the auth tier 1 login only, plus `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.

## Critic at auth tier 2, the direct call (F125-FR-028, F125-FR-029)

| Item | Value |
|---|---|
| Method and address | `POST <base>/v1/messages`; base from `SPECSTRIDE_CLAUDE_CRITIC_BASE_URL`, else `ANTHROPIC_BASE_URL`, else `https://api.anthropic.com`; trailing slash removed |
| Headers | `Content-Type: application/json`, `x-api-key: <key>`, `anthropic-version: 2023-06-01` |
| Body | `{"model": <M>, "max_tokens": 2048, "messages": [{"role": "user", "content": <prompt>}]}`; no `tools` field |
| Reply | Concatenation of the `text` blocks of `content` |
| Key | `SPECSTRIDE_CLAUDE_CRITIC_API_KEY`, else `ANTHROPIC_API_KEY`; none: the call fails before it is sent |
| Redirects | Refused. A plain address only for the loopback address |
| Time limit | The critic's time limit, an input of `complete` |

## Proposer and critic through the SDK (F125-FR-035, F125-FR-038)

Options of the one call that starts a session, per role. `env` replaces the process environment.

| Option | Proposer | Critic |
|---|---|---|
| `model`, `cwd` | as set | empty temporary directory |
| `permissionMode` | `acceptEdits` (the bypass mode only by the consumer's choice in user configuration and with the precondition of F125-FR-012) | `dontAsk` |
| `allowedTools` / `tools` | the allow list | `tools: []`, `disallowedTools: ["mcp__*"]` |
| `mcpServers`, `strictMcpConfig` | `{}`, true | `{}`, true |
| `settingSources` | `[]` | `[]` |
| `sessionId` / `resume` | minted / by id | minted; `persistSession: false` |
| `maxTurns`, `maxBudgetUsd` | not set | 1; the cap |
| `env` | the allow-list with the key of the secret reference and a throwaway `CLAUDE_CONFIG_DIR` | the same, plus `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` |
| `disallowedTools` | plus the sub-agent tool when `harnesses.claude.disableSubagents` is on | as above |

Option names are those of the type file of `claude-agent-sdk` 0.3.284, read and not executed
(verified-on 2026-09-29; `unverified` as a run).
