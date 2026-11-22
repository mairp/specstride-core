# R24 — Warm start and context carry-over

Written 2026-09-29. Labels: **[M]** measured, **[E]** estimated (method given). Every claim also carries one tag from the common brief. All savings are stated against R21's Claude-proposer baseline (R21 F-2, F-4, F-10, Recommendation item 1). No paid model call was made. Source repositories were read only (`git show 9cab15d:<path>`), plus usage fields of the reference run's session transcripts (as R21 did) and public documentation.

## Prior art consulted

| File | Use |
|---|---|
| `docs/ecosystem/research/BRIEF-COMMON.md`, `prompts/specstride-ecosystem.md` §0, §1, §2 (decisions 21, 22, 23), §4 row R24 | Scope, governing text, template. |
| `research/R21-time-use-baseline.md` (F-2, F-3, F-4, F-6, F-8, F-10, gap 20) | **Reused** as the baseline. Cold start: median 0.5 min to first action, 5.2 % of Claude pass time (6.7 h), first turn median 107.8 k tokens; killed passes 24.9 % of Claude proposer time (37 passes, 32.5 h); 515 Claude passes in 331 attempts. |
| `prompts/analysis/A5-run-time-evidence.md` §4 | **Reused** (orientation by pass position, token totals). **Extended** with a first-turn cache-hit measurement (F-3). |
| `prompts/analysis/A6-micro-loop-survey.md` §4 (`:187-222`) | **Reused**: carry artefacts and a short distilled note, not transcripts; self-conditioning [S26]; the field changed its mind on compaction twice. **Extended** with current Claude Code cache and resume documentation. |
| `prompts/analysis/A7-local-loop-prior-art.md` (`:119-134`, `:206`, `:298`) | **Reused**: yield, pass checkpoint and `PROGRESS.md` are the only carriers. |
| `research/R12-memory-compression.md` (F1–F4, Table 1, DP-R12-3) | **Deferred to** for cross-phase and cross-run memory. **Adopted**: the inherited-obligations index and the runtime ledger; "anything Specstride carries must be a file Specstride wrote" (F25). |
| `research/R5` Q4, `R6`, `R7` Q5, `R9` F10, `R10` Q6 | Harness session facts (section F-5). |
| Specstride `9cab15d`: `orchestrator.sh`, `proposer.sh` | What the loop carries today (F-1). |

## Questions answered

**Q1. What may a pass, an attempt, a phase and a relaunch each inherit?**
See the table in F-2. In short: a pass inherits the runtime-written handoff plus, where allowed, its attempt's session; an attempt inherits files only (feedback, gist, hint, ledger) and never a session; a phase inherits the inherited-obligations index and the ledger, not `PROGRESS.md` as a required read; a relaunch inherits every file and the counters (decision 23) but starts a fresh session.

**Q2. What does today's loop already carry?** Eight carriers, none of them a session (F-1).

**Q3. What is the saving in time and tokens against the baseline?**
Time: small. Continuation can remove at most about 0.6 % of the reference run's alive time and about 1–2 % of Claude pass time [E] (F-4). Tokens: session continuation is not a clear win. It removes the first-turn prompt write but enlarges the context that is re-read on every later turn, which is the dominant cost. It pays only for passes shorter than roughly 24–86 turns [E] (F-4). A deterministic handoff plus a smaller prompt saves more than continuation (F-4, table).

**Q4. Which harnesses support continuation within an attempt?** Claude, Codex, pi, prime, opencode, Copilot yes (Gemini in headless mode unverified); dsh no; API-only providers only through the adapter's own message list (F-5).

**Q5. When is a continued session dropped for a fresh one?** Ten rules in F-6.

**Q6. How are results kept when a pass is killed?** Checkpoint refs per kept unit, an append-only ledger, and a SIGINT-first kill (F-7). Important correction to the framing of aim 2: today's kill does **not** delete files. The loss is in-flight subagent and job work, the pass's context, and knowledge of what was kept.

**Q7. What is the file-based carry-over format?** F-8.

## Findings

### F-1 What the loop carries today `verified-local`

| Scope | Carrier | Evidence (`9cab15d`) |
|---|---|---|
| Pass → pass | `PROGRESS.md`, told "Read it FIRST each pass; never redo verified work" | `orchestrator.sh:1505-1508` (via R12 F4; prompt text seen in `build_proposer_prompt`, `orchestrator.sh:~1492-1512`) |
| Pass → pass after a watchdog kill | Pass checkpoint: reason, elapsed, last 25 tool calls, last 5 messages, per-reason advice | `proposer.sh:940-990` (`write_pass_checkpoint`), `:1125-1160` (`pass_checkpoint_block`) |
| Pass → pass across a wait | Yield `on_resume` string | `orchestrator.sh:1476-1486` |
| Attempt → attempt | Critic feedback, one-line gist, diagnostician hint, acceleration note | R12 F4, `orchestrator.sh:1564-1606` |
| Phase → phase | Inherited obligations (whole task texts) | R12 F1, F2 |
| Run → run | Learning observations (numbers) | R12 F5 |

Facts that shape the design:

- Every Claude pass is a new `claude -p`. Other harnesses are launched with `--no-session` (`proposer.sh:594-599`, `:615`). Claude's config overlay is created and released per pass (`proposer.sh:579-581`, `backend_overlay_prefix` / `backend_overlay_release`). `verified-local`
- The only git commit is one per approved phase: `maybe_git_checkpoint`, `orchestrator.sh:998-1013` (commit at `:1008`; gated by `GIT_COMMITS`, default `auto`, `:225`). Nothing is committed per pass or per unit. `verified-local`
- A grep of both scripts for `git reset`, `git clean`, `git checkout` and `git stash` finds none, so a killed pass leaves its files in the tree and the next pass builds on them. `verified-local` (command: `git show 9cab15d:<file> | grep -n "git.*\(reset\|clean\|checkout\|stash\)"`, no output for either file).
- Attempts restart at 1 on a resume: `local attempt=1` (`orchestrator.sh:1742`), comment at `:1361`. The oscillation window is deliberately reset by a resume: "A resumed run is a new convergence window" (`:1323-1325`). Decision 23 changes the first; the second needs care (Open questions 3). `verified-local`
- The prompt orders stable material first and volatile material last. In the reference run's phase-15 prompt the inherited obligations start at line 657 and the "PRIOR ATTEMPT WAS REJECTED" block at line 832 of 1143 (`proposer-prompt.phase15.txt`, `grep -n "^## "`). The prefix up to the volatile blocks is byte-stable within an attempt. `verified-local`

### F-2 What each scope may inherit `inferred`

Rests on F-1, decisions 21–23, R12's rulings and R23's critic boundary.

| Scope | May inherit | May not inherit | Form |
|---|---|---|---|
| **Pass** (inside an attempt) | The attempt's session, where the harness supports it and the rules of F-6 hold; the runtime handoff (F-8); the kill checkpoint; the yield `on_resume` string and job result | A session from a killed or futile pass; a model-written summary | Session id minted by the adapter; files |
| **Attempt** | Critic feedback, gist, diagnostician hint, acceleration note (as today); the ledger of kept units; a distilled failure note (error signature, what was tried; runtime-extracted, not model-written) | Any session; raw transcripts of failed attempts (self-conditioning, A6 [S26]) | Files only |
| **Phase** | Inherited-obligation index (R12 DP-R12-3); the ledger; approved commits | `PROGRESS.md` as a required first read; earlier phases' attempt directories | Files regenerated from plan, git and events |
| **Relaunch** | Everything on disk; the counters of decision 23; the ledger; the newest kill checkpoint | A session (F-6 rule 7) | Files |
| **Critic** (any of the above) | Nothing carried. Fresh session, tool-less. The final check result per unit (ledger `units` view) as evidence, never the repair history (decision 21, R23 owns) | Handoff, `PROGRESS.md`, harness memory | R23 |

### F-3 Prompt caching already helps some fresh passes; most miss `verified-local` for the counts, `inferred` for the cause

Method: first assistant usage record of each main (non-sidechain) transcript of the reference run under `/root/.claude/projects/-root-agentic-netops-srl/`, usage fields only (script `/tmp/specstride-research/R24/u.py`). 158 sessions, first-turn total median 107,798 tokens, which reproduces R21's 107.8 k. [M]

| Measure | Value [M] |
|---|---|
| Sessions whose first turn read at least 60 k tokens from cache | 64 of 158 (41 %) |
| Sessions whose first turn read at most 20 k from cache (static tools and system prompt only; typically 16,660 read, 112–121 k created) | 77 of 158 (49 %) |
| Gap to the previous session's start, hit vs miss (median) | 0.8 min vs 38 min |
| Sum over sessions of first-turn cache creation / cache read | 7.6 M / 8.4 M tokens |

Reading: a fresh pass reads its whole prompt from cache when it starts within about a minute of a pass that sent the same bytes. Those are mostly the repeated blocked passes of phase 3 (51 passes, A5), where the prompt did not change. `inferred` (the hit sessions cluster at 0.5–0.8 min gaps; the identification with phase 3 is not verified session by session). The productive passes mostly miss although the prompt prefix is byte-stable up to line 832 (F-1) and the gap (median 38 min) is inside a one-hour TTL if the reference run ran on a subscription. Candidate causes, none verified: (a) Claude Code's context includes a git status snapshot and branch/commit list taken at startup, and "sequential sessions share the prefix only when the git status snapshot matches" (Claude Code prompt-caching page, cache scope section), which changes whenever the tree changes; (b) the run used the five-minute bucket (API key or credits over plan); (c) a volatile byte early in the prompt. `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS=1` removes "the git status snapshot from Claude's context" (env-vars page), so cause (a) can be tested by a stage-1 probe (Open questions 2).

Documentation facts, all `verified-doc`, accessed 2026-09-29:

| Fact | Source |
|---|---|
| TTL is five minutes by default or one hour; refreshed at no cost on each use; measured from the start of the request, so generation time counts against it | https://platform.claude.com/docs/en/build-with-claude/prompt-caching |
| Writes cost 1.25x (5 min) or 2x (1 h) base input; reads 0.1x (0.05x for Opus 5.5) | same |
| Changing tools, thinking or effort settings invalidates downstream cache; a cached prefix must match exactly | same; https://code.claude.com/docs/en/prompt-caching |
| Claude Code: the main conversation, including `-p` and SDK turns, gets a one-hour TTL only on a subscription within plan usage; API key, credits or cloud provider get five minutes; subagents, compaction and forks get five minutes | https://code.claude.com/docs/en/prompt-caching ("Which TTL each request gets") |
| `CLAUDE_CODE_PROMPT_CACHE_TTL=5m\|1h` (v2.1.242 or later) chooses the main-conversation TTL; `FORCE_PROMPT_CACHING_5M=1` overrides it; the result's `usage.cache_creation` reports `ephemeral_1h_input_tokens` and `ephemeral_5m_input_tokens` | https://code.claude.com/docs/en/env-vars; prompt-caching page |
| The cache is effectively scoped to one machine and directory; parallel sessions in one directory share a prefix | prompt-caching page, "Cache scope" |
| On resume the system prompt of the first request is kept; different `--append-system-prompt` text takes effect only after compaction; compaction invalidates the conversation layer and its summarisation call runs on the five-minute bucket | prompt-caching page, "Resuming a session"; R5 Q4 |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (100 k to 1 M tokens) and `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` (1–100 %, can only lower the threshold) control auto-compaction | env-vars page |

### F-4 The saving against the baseline

**Time** [E]. Method: cold-start time by pass position from A5 §4 (reference run, transcripts) and R21 F-10, restricted to the passes a continuation could touch (not the first pass of an attempt).

| Item | Baseline | Addressable by continuation | Saving |
|---|---|---|---|
| Claude population, cold start | 6.7 h = 5.2 % of 130.5 h pass time (R21 F-10, F-2) [M] | Non-first passes are 184 of 515 (36 %; 515 passes minus 331 attempts) [M count]; their orientation is already shorter (A5: 0.4 min after a normal end, 0.5 after a kill, 1.2 for a first pass) | Upper bound 5.2 % x 36 % = **1.9 % of Claude pass time (about 2.4 h)**; at A5's per-position medians about half of that, **about 1 %** |
| Reference run | 0.9–3.2 h orientation (R21 F-10) of 127.9 h alive | 95 normal-end passes x 0.4 min + 21 after-kill x 0.5 min = 0.8 h at medians | **At most 0.6 % of alive time** |
| Killed passes (24.9 % of proposer time) | 32.5 h | Continuation does not prevent kills; a resumed killed session also carries the futile approach (F-6 rule 2) | 0 |

The model still has to act in a continued pass: the first response takes a median 3.5 s and the CLI starts about 2.2 s after `iter_start` (A5 §4, `verified-local` via A5). Against decision 21's 25 % elapsed-time target, session continuation is worth about one to two per cent of pass time. Its case rests on cost, not time.

**Tokens and cost** [E]. Inputs measured (A5 §4, reference run, 141 passes): first turn median 107.8 k; context at the end of a pass median 150 k (p90 283 k, max 461 k); 998 M input tokens, almost all cache reads, i.e. about 7.1 M per pass; 17.0 M cache-creation tokens, about 120 k per pass; 2.86 M output tokens, about 20 k per pass. The mean context is about 129 k, so a pass has roughly 55 model turns (7.1 M / 129 k) `inferred`. Price ratios: read 0.1, write 1.25 (five-minute) or 2.0 (one-hour, the subscription default for the main conversation), output 5 (R21 F-6 uses 5).

Cost of one reference-run pass in units of base input tokens: creation 120 k x (1.25 to 2.0) = 150–240 k; reads 7.1 M x 0.1 = 710 k; output 20 k x 5 = 100 k; total about 960–1,050 k. So reads are about 70 % of a pass, the first-turn prompt write about 14–21 %.

What continuing a session changes for the second pass of an attempt:

| Term | Fresh pass | Continued pass (cache warm) |
|---|---|---|
| First turn | Writes about 108 k at 1.25–2.0 = 135–216 k | Reads about 150 k at 0.1 = 15 k, writes a short delta prompt about 5 k = 6–10 k |
| Every later turn | Reads a context that starts at 108 k plus orientation reads (the fresh pass re-reads `PROGRESS.md` and files, 32 % of files were read earlier in the phase, A5) | Reads a context that starts at 150 k or more: larger by 28–48 k, i.e. +2.8 to +4.8 k input-equivalents per turn |
| Net | | Saves about 115–190 k on turn 1, costs 2.8–4.8 k per turn |

Break-even is about **24 turns** (gap 48 k, five-minute write) to **86 turns** (gap 28 k, one-hour write). At the reference run's pace (about 3 turns per minute, `inferred` from 55 turns per 18.6-minute mean pass) that is 8 to 29 minutes. The median Claude pass is 3.4 min (R21 F-2), about 10 turns, so a short pass gains; the p90 pass of 51 min, about 150 turns, loses. A cache miss on resume (gap over the TTL) reverses the sign: the continued session rewrites 150 k or more instead of 108 k.

| Lever | Effect on a reference-run pass [E] | Works on | Risk |
|---|---|---|---|
| Continuation within an attempt, warm cache, short pass | Saves about 115–190 k on turn 1 (11–18 % of pass cost) minus 2.8–4.8 k per turn | Harnesses with resume (F-5) | Negative for long passes; carries failed reasoning |
| Continuation, cache cold or long pass | Net cost increase | | Same |
| Cache-stable fresh start (byte-stable prefix, volatile blocks last, no per-pass volatile system context) | If the productive-pass miss is fixed, turn 1 write becomes a read: about 125–205 k saved per pass (12–20 %); no per-turn penalty | Any harness with prefix caching (Codex reports `cached_input_tokens`, R6) | Needs the F-3 probe to confirm the cause |
| Smaller prompt: obligations index (R12: first-turn tokens down at least 40 % at the pass mark) | 43 k fewer per turn x 55 turns x 0.1 = 237 k, plus turn 1: about 25–30 % of pass cost | Every harness | Owned by R12; changes a pinned prompt (divergence row) |

Conclusion: the order of value is the smaller prompt, then a cache-stable fresh start, then continuation. Continuation is worth building because decision 22 requires it and it helps short passes and the `on_resume` case, but it is the smallest and least certain of the three. `inferred` from the table; the experiment in section Recommendation measures it.

**Kept work on a kill** [E]. The baseline cannot split lost from reused time (R21 gap 20). What can be said: 37 Claude kills, 32.5 h, of which hard cap 23 passes and 26.6 h (about 70 min each). Files survive (F-1), so the time is not lost as bytes. Measured losses are in-flight subagent and job work (A5: 35 % of killed-pass time was spent waiting on subagents that died with the pass; four recorded kills of live chains) and re-derivation of state by the next pass (the confirmed live case of six consecutive passes dying while rebuilding one binary, `proposer.sh` comment above `pass_checkpoint_block`). A ledger cannot bring the hour back; it bounds the unknown state to one unit and makes the loss measurable. No hours are claimed. `inferred`.

**Risk of stale or wrong carried context** `inferred`, controls in F-8:

| Carried item | Failure | Effect | Control |
|---|---|---|---|
| Session history | Failed attempts and errors stay in context and raise the error rate (A6 [S26]); a wrong belief persists | Repeats a futile line | Drop rules 2, 3, 4 |
| `PROGRESS.md` | Append-only prose, 206 KB in the reference run (R12 F3), written by the proposer; may claim progress that is not there (A6 [S27]) | Skipped work or redone work | Demote to notebook; ledger is the source of state |
| Handoff | Generated from a tree that has since changed | Wrong "remaining" list | Tree hash in the handoff; regenerated at every pass start; "the tree wins" line |
| Ledger | Entry for a commit that no longer exists, or forged by the proposer | Wrong "kept" claim | Hash chain; runtime verifies commits with `git cat-file`; file outside the proposer's write scope where the harness allows it |
| Counters | An edited phase inherits old counts | A limit fires early | Key on phase shape hash (as learning does, R12 F5); reset event on mismatch |

### F-5 Session continuation by harness `verified-doc` / `verified-local` as stated

| Harness | Continue within an attempt | Fresh session for a new attempt / critic | Conditions | Source |
|---|---|---|---|---|
| Claude Code | First pass `--session-id <uuid>`; later `--resume <id>`; never `--continue` (it picks the newest session in the directory, including the user's) | New `--session-id`, critic with `--no-session-persistence` | Needs persistence, so the same `CLAUDE_CONFIG_DIR` must survive across passes: today's per-pass overlay (`proposer.sh:579-581`) breaks it and must become per-attempt. `total_cost_usd` on resume is cumulative; per-pass deltas are needed. SIGTERM leaves the turn unfinished, SIGINT ends it | R5 Q4 (`:122-149`); headless page |
| Codex | `codex exec resume [SESSION_ID\|--last] [PROMPT]` | `codex exec` (optionally `--ephemeral`) | Never `--last` unless the config home is per run. Help output read locally, never run | R6 `:17`, `:37` |
| Gemini CLI | `-r/--resume <latest\|index\|uuid>`; sessions project-scoped, 30-day retention, `maxSessionTurns` makes non-interactive mode exit with an error when hit | Default | Whether `-p --resume <uuid>` runs headlessly is `unverified` | R7 Q5 (`:70`, `:186`) |
| Copilot CLI | `--session-id ID` (exact) or `--resume=ID`; a bare `--resume` fails under `-p` | Default | Documentation only | R7 (`:71`) |
| opencode | `opencode run -s <id>`; SDK `session.prompt` on a session id | New run | Sessions live in SQLite under `XDG_DATA_HOME`; a per-pass throwaway overlay defeats resume | R10 Q6 (`:20`) |
| pi | `--session-id <id>` (created if missing), `-c`, `--session` | `--no-session` | Deterministic id per attempt; `pi --help` read locally | R9 F10 (`:54`) |
| prime-agent | `-c`, `-r [path\|id]`, `--session-dir` | `--no-session` | Own session directory per run | R9 F10 (`:55`) |
| dsh headless | **None**: a fresh `session-<uuid>` per run, only a task positional | Always | File-carried context only | R9 F10 (`:56`), `dsh-headless/lib/index.js:58-98` |
| OpenRouter, z.ai (HTTP) | No server-side session. The adapter can keep its own message list and resend it | Empty list | Cost and caching depend on the provider, `unverified` | R6 |
| Discovered, unverified harness | Only if its descriptor declares a resume mode | Default | "Most recent session" modes are refused (race with the consumer's own sessions) unless the run owns the session directory. Undeclared means file-carry | decision 17 |

Descriptor fields the generic adapter needs (evolvability): `session.mode` (`none`, `by-id`, `by-name`, `most-recent`), `session.create_flag`, `session.resume_flag`, `session.store_env` (the variable that relocates the session store), `session.ttl_seconds` (cache lifetime if known, else 300), `session.reports_usage` (whether context size is observable).

### F-6 When a continued session is dropped for a fresh one `inferred`

Rests on F-3 to F-5 and A6 §4.3. Thresholds are parameters; R22 owns the loop-parameter defaults and R27 measures them.

1. **New attempt, critic, and a change of role**: always fresh (decision 22).
2. **Any watchdog kill** (hard cap, repeat stall, progress stall, idle): fresh, with the checkpoint. A killed or futile context carries the failure (self-conditioning). Exception, deferred to measurement: a hard-cap kill after productive work, sent SIGINT so the turn ended cleanly.
3. **Repeated failure**: two consecutive passes without evidence or without a kept unit, or a micro-loop escalation: fresh, with a one-paragraph runtime-extracted failure note.
4. **Context fill**: drop when the last observed context exceeds `min(150 k, 50 % of the harness's known window)` tokens. Reason: the per-turn penalty grows with the carried context (F-4) and the baseline end-of-pass median is already 150 k. The adapter must set the compaction trigger above this so the drop happens first, because harness compaction is a model-written summary that Specstride cannot verify and that invalidates the cache (R12 F25, F21a). A harness that does not report usage cannot use rule 4 and falls back to a pass-count cap of 2 continuations.
5. **Age**: drop when the time since the last request exceeds the cache lifetime for that harness bucket (Claude subscription main conversation: 1 h; API key or unknown: 5 min; the adapter reads `usage.cache_creation` to confirm which). After a yield wait the answer is almost always fresh (mean wait in the reference run 82.0 h / 9 = 9.1 h).
6. **Configuration drift**: fresh if the model, effort, tool set, plugin set or system-prompt text must change (system prompt is frozen on resume, the cache breaks on a model or tool change).
7. **Relaunch** (process restart, manual or automatic): fresh. Restart gaps have median 0.18 h and p90 2.6 h (R21 F-8), and a crashed process may have left a half-written turn. Recorded as an interpretation in Open questions 4.
8. **Session unavailable**: resume error, missing transcript, harness upgraded between passes: fresh, and a `session_fallback` event is emitted (announced, as decision 21 requires for fallbacks).
9. **Continuation cap**: at most 3 continued passes in an attempt (mean is 1.56 passes per attempt in the Claude baseline, R21 F-3 counts).
10. **Oracle**: continuation is off under the parity oracle (decision 22); every pass gets a new session id and, for Claude, `--no-session-persistence`.

The continued pass's prompt is a delta: the fixed standing prompt is not resent; per-pass instructions go in the user prompt, not the system prompt, because the system prompt is frozen on resume (R5 Q4).

### F-7 Keeping the results of work when a pass is killed `inferred`, on `verified-local` facts in F-1

Today a kill returns 124, writes a markdown checkpoint of what the pass was doing, and the tree is left as is. Proposed layers, cheapest first:

1. **SIGINT before SIGTERM** for Claude passes, with a grace period. SIGINT ends the turn cleanly and records a result; SIGTERM leaves it unfinished (headless page; R5 Q4). This makes the session resumable and the transcript complete. Other harnesses: the adapter declares its polite-stop signal.
2. **A ledger line per kept unit** (F-8), written by the runtime after the inner check passes, so a kill loses at most the unit in progress. Requires the micro-loop layer (R23, feature 115). With the layer off, the ledger has one entry per phase attempt.
3. **A checkpoint ref per kept unit**: `refs/specstride/<run>/phase-<n>/unit-<k>` created from a snapshot tree with plumbing (`git write-tree` on a temporary `GIT_INDEX_FILE`, then `git commit-tree`, then `git update-ref`). It leaves the user's branch, index and working tree untouched, and does not change today's single "phase approved" commit (`orchestrator.sh:1008`), which keeps parity. Alternative rejected: commits on the working branch, which pollute history and need a squash. Not a git repository: the ledger records a content hash of the changed files instead.
4. **Job and subagent results go to files** before the pass ends: yield already does this for long jobs (`proposer.sh:1185-1216`); the handoff tells the pass to write subagent results under the state directory, because subagents die with the pass (A5).
5. **The next pass starts from the ledger**: "units 1–4 kept, unit 5 was in progress when the pass was killed at 60 min for reason R", plus the existing checkpoint.

Result: a kill loses the in-flight unit, not the pass's whole state description. The hours in the 24.9 % are not recovered by this; only micro-loops that keep passes short (R23) and the parameters (R22) reduce their number. Stated honestly: this report's saving on kills is "bounded and measurable", not a number of hours.

### F-8 File-based carry-over format `inferred`

Used on every harness, and the only carrier on harnesses that cannot continue (dsh, unverified harnesses, HTTP providers). Under the phase state directory of the run:

| File | Writer | Content | Rules |
|---|---|---|---|
| `carry/ledger.jsonl` | Runtime only | One line per kept unit: `pass_id`, `attempt_id`, `unit_id` (task id), `ref`, `tree_hash`, `checks: [{id, cmd_hash, result, duration_s}]`, `session_id` (if any), `t`, `prev_sha` | Append-only; `prev_sha` chains lines; verified at read; the critic's evidence view (final check per unit) is derived from it; repair history lives in a separate `cycles.jsonl` that the critic never receives (decision 21, R23) |
| `carry/counters.json` | Runtime only | Per phase: `attempt`, `rejects`, `malformed_streak`, `iterations`, `oscillation_window`, `phase_shape_hash` | Atomic write; survives resume (decision 23); mismatched shape hash resets with an event; flag `--reset-counts` |
| `carry/handoff.md` | Runtime, regenerated at each pass start, never appended | Target 6 KB or less: phase, attempt n of M, counters; the last K ledger lines; remaining units (plan minus ledger); last failing check signature; newest kill checkpoint; yield `on_resume` and job result; feedback pointers; `tree_hash` it was built against | The prompt states: "if this disagrees with the tree, the tree wins" |
| `carry/session.json` | Adapter | `session_id`, `harness`, `harness_version`, `model`, `first_request_t`, `last_request_t`, `last_context_tokens`, `continued_passes`, `store_dir` | Read by the drop rules (F-6) |
| `PROGRESS.md` | Proposer | Notebook | Stays; loses "Read FIRST"; rotated per phase by the runtime; the prompt points to `handoff.md` first |
| Inherited-obligation index | Runtime | ID, title cut to a fixed length, path to full text (R12 DP-R12-3) | Divergence row; off under the oracle |

Each item is regenerable from plan, git and events, which makes it checkable byte for byte (R12 Table 1, "Full").

Principle VIII rewording proposed for the amendment: *"Unattended, hermetic proposer passes. Each attempt starts a fresh session. Passes inside an attempt may continue that session only where the harness supports it and the runtime's drop rules allow; the critic, every new attempt and every relaunch start fresh. Anything else that is carried is a file the runtime wrote. The config home is throwaway per run (not per pass, so a continued session can be found), and auto-loaded context is off."* The current citation `proposer.sh:1437` is stale (R5 open question 8); `proposer.sh:594-599` and `:579-581` carry the fresh-per-pass behaviour.

## Version/date pins

| Item | Value |
|---|---|
| Specstride baseline | `9cab15d` |
| Claude Code | 2.1.284 (R5); documentation accessed 2026-09-29 |
| `CLAUDE_CODE_PROMPT_CACHE_TTL`, `promptCacheTtl` | Claude Code v2.1.242 or later |
| Codex CLI | 0.153.4, help only (R6) |
| pi / prime-agent / dsh | 0.80.6 / 0.7.3 / 0.1.0-rc.8 (R9) |
| opencode SDK | 1.18.33 (R10) |
| Baseline | R21, cutoff epoch 1790637900; transcript usage sampled 2026-09-29 |
| Docs | platform.claude.com prompt-caching; code.claude.com prompt-caching, env-vars, headless (all 2026-09-29) |

## Options compared

| Option | Time saving vs baseline | Token/cost saving vs baseline | Stale-context risk | Harness coverage | Parity | Complexity |
|---|---|---|---|---|---|---|
| A. Fresh every pass, today's carriers (parity) | 0 | 0 | Low (but `PROGRESS.md` is unbounded prose) | All | Exact | None |
| B. Fresh every pass + runtime handoff + ledger + cache-stable prompt + index (no continuation) | Under 1 % (orientation shorter) [E] | Largest: prompt down by 40 % or more, first-turn write becomes a read if F-3 is confirmed; about 25–45 % of pass cost [E] | Low: regenerated from ground truth | All, including dsh and discovered | Divergence rows for prompt change | Low |
| **C. B + continuation within an attempt, under the drop rules** | B + up to 1–2 % of pass time [E] | B + a further 11–18 % of pass cost on short passes; a loss on long ones [E] | Medium: history carries errors | Where F-5 says yes | Off under the oracle | Medium |
| D. Continuation across attempts and after every kill | As C | Worse than C after 24–86 turns; cache cold across yields | High (self-conditioning) | | | Rejected by decision 22 |

## Recommendation

**Adopt C, built in this order: (1) runtime ledger, counters and handoff for every harness; (2) cache-stable prompt and the obligations index; (3) continuation within an attempt on harnesses that declare it, behind the F-6 drop rules; (4) per-unit checkpoint refs and SIGINT-first kill.** Continuation follows decision 22 as written but is treated as the smallest and least certain saving; it stays default-on only if it earns it, on the same footing as decision 21.

Measured before it is defaulted (offered to R27): (a) probe the F-3 cause by comparing first-turn `cache_read` with and without `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS=1` on identical prompts (few small calls, or replay from existing transcripts); (b) a paired-run arm "continue" vs "fresh" on short-pass phases, primary metric cost per pass (recorded plus estimated unrecorded, R21 open question 2), guardrails: no rise in false-MISSING or MALFORMED rate, no rejection traced to stale carried state. Pass mark: net cost no worse and no rise in first-attempt rejects. Otherwise continuation defaults to off and B remains.

Confidence: **high** that the file-based carry-over (B) is right and that continuation cannot deliver more than about 2 % of time; **medium** that cache-stable fresh starts recover the first-turn write (mechanism unverified); **low-medium** that continuation is a net cost saving in practice (depends on pass length and on the cache bucket).

## Matrix rows

None for the defined matrix columns. Supplementary row set for the capability matrix owner, column "session continuation" (values in F-5): Claude yes (`--session-id`/`--resume`); Codex yes (`exec resume`); Gemini yes, headless use unverified; Copilot yes (`--session-id`); opencode yes (`-s`, needs the same data home); pi yes (`--session-id`); prime yes (`-c`/`-r`); dsh no; HTTP providers adapter-side only; discovered harnesses only if declared.

## Open questions / risks

1. **Decision 22's expected benefit is smaller than the prompt suggests.** Evidence: F-4 (time at most 1–2 % of pass time; cost break-even at 24–86 turns; negative for long passes and after a cache miss). Not infeasible or harmful, so it is a `DECISIONS-PENDING` note, not a conflict. Default I proceed on: implement as decided, default on only for passes within the drop rules, gated by the measurement above. If the owner rules it must be unconditional, the cost of long passes rises.
2. **Why productive fresh passes miss the cache is unverified** (F-3). The probe is cheap. If the cause is the git status snapshot, disabling it (allowed: the runtime does the committing) is a one-line adapter setting worth more than continuation.
3. **Decision 23 vs the oscillation window.** Today a resume starts a new convergence window on purpose (`orchestrator.sh:1323-1325`). Carrying reject counts must not make the first rejection after a resume look like oscillation. The window should be keyed on attempt sequence, not on run start. R22 owns the parameter; the divergence row must name it.
4. **Relaunch is treated as a fresh session.** Decision 22 says passes inside one attempt may continue; a relaunch inside an attempt is arguably one. I chose fresh because of age and crash state (F-6 rule 7). Default I proceed on: fresh. If the owner wants relaunch to continue when the gap is inside the cache lifetime, only rule 7 changes.
5. **Per-run config home for Tier 1 continuation.** Continuation needs the transcript store to persist across passes (Claude: config dir; opencode: `XDG_DATA_HOME`), which conflicts with today's per-pass throwaway overlay. Per-attempt or per-run homes keep hermeticity between runs but not between passes; Principle VIII wording in F-8 reflects this.
6. **Subscription accounting.** On a subscription the dollars are allowance consumption, not money (R21 F-6); the break-even analysis is in token-equivalents. Resumed passes report cumulative `total_cost_usd`; telemetry must store deltas (R5).
7. **Compaction is not observable to me.** Whether the stream-json output marks an auto-compaction is `unverified` (not found in the pages read); rule 4 avoids depending on it by dropping before the trigger.
8. **Ledger forgery.** The hash chain detects edits by the proposer only if the runtime holds the last hash outside the proposer's reach; where the harness cannot restrict file writes the control is detection, not prevention. R11 to review.
9. **Baseline limits.** The transcript sample is one run; hit/miss cause attribution is inferred; turn counts are derived from token totals rather than counted. A per-pass turn count in telemetry (R14) would replace the estimate.
10. **Neighbours.** R23 owns the unit definition and the critic's view; R22 owns thresholds; R12 owns the index and cross-run memory; the ledger schema in F-8 must be agreed with R23 and R14 (gap 14, pass identity: `pass_id` and `attempt_id` here).
