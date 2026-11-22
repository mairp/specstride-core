# Common brief for every research and verifier agent

You start with no context. Read this file in full, then the parts of
`/root/specstride-claude/prompts/specstride-ecosystem.md` named below, then your own assignment.

## 1. Purpose of the effort

The owner has three overlapping systems: **Specstride** (Bash + Python gated proposer → critic loop),
**mixture-of-loops** (Python; derives, validates and launches a launch contract and supervises the run)
and **Lisa** (TypeScript, 19 packages; gate engine, adapters, scheduler, server, otel, kanban).
They are being consolidated into one TypeScript product called **Specstride**, delivered through host
plugins (Claude Code first, dsh second) exposing two skills, `specstride-run` and `specstride-reverse`.

This effort writes research, architecture and specifications. **It writes no product code.**
Stage A (now) produces research reports, which feed the synthesis artifacts in `docs/ecosystem/`:
`research-synthesis.md`, `architecture.md`, `consolidation.md`, `traceability.md`, `decision-log.md`,
`constitution-amendment.md`, `feature-briefs.md`, `roadmap.md`.

The quality the owner cares about most is **evolvability**: a new host, harness, loop strategy or UI
plugs in without core changes. Where a choice trades convenience against that, prefer evolvability and
state the cost.

## 2. Required reading in the prompt file

In `/root/specstride-claude/prompts/specstride-ecosystem.md`:

- §0 (what this is, the aims and the run-time evidence)
- §1 (inputs: baselines, source repositories, "Which Lisa", analysis already done, this machine)
- §2 (owner decisions 1–23 and the known tensions) — these are **decided**. Build on them. If you find
  hard evidence that one is infeasible or harmful, do not work around it and do not play it down:
  report it under "Open questions / risks" and in your digest as a `DECISIONS-PENDING` item, with the
  evidence, and continue on the decision as written.
- Your own row in §4 ("Must answer", "Owns").

Where a file in `prompts/analysis/` disagrees with the prompt file, the prompt file is right
(see the notes in §1 about A1, A2, A3 and A8). Treat the analysis files as leads to verify.

## 3. Safety rules (binding)

- Source repositories are **read-only**: `/root/specstride`, `/root/mixture-of-loops`, `/root/lisa`,
  `/root/mixture-of-loops_lisa`, `/root/agentic-netops-srl`, `/root/specstride-harness-roadmaps`,
  `/root/specstride-otel-prompts`, `/root/dsh-trace-otel`, `/root/dsh-plugin-specstride`.
  Never modify them. No worktrees, no branches, no checkouts, no `git fetch/pull/push`, no stash.
  To look at a tree at a commit use `git show <commit>:<path>`, `git diff`, `git ls-tree`, or
  `git archive <commit> | tar -x -C <scratch>` / `git clone --local` **into a scratch directory**
  under `/tmp/specstride-research/<your-id>/`.
- `/root/agentic-netops-srl` has a run in progress. Read its run state, events and logs only. Never
  write there, never take its lock, never signal its processes.
- Never read credential files, token stores, keychain entries, `auth.json`, `.credentials*`,
  `.env` files with secrets, on this machine or anywhere else. Describe auth mechanisms from public
  documentation and source code only.
- CLIs may be run for detection and introspection only: `command -v`, `--version`, `--help`,
  `claude plugin details`. No logins, no state changes, no installs of harness CLIs.
- **No paid model calls** unless your assignment explicitly allows measurement probes. If it does:
  few and small, pass `--max-budget-usd` where the CLI supports it, stop at the first usage-limit
  signal, and list every probe (command, purpose, cost if reported) in your digest.
- Write only your own output file (and scratch files under `/tmp/specstride-research/<your-id>/`).
  Do **not** run `git add`/`git commit` in `/root/specstride-claude`, and do not edit
  `PROGRESS.md`, `DECISIONS-PENDING.md` or another agent's report. The orchestrator does that.
- Naming rule: a backend registered in `/root/specstride/lib/backends.py` that is not one of the
  harnesses named in §0 of the prompt is specific to the owner's machines. Its name appears in **no**
  output, even where an as-is spec mentions it. Write "a locally registered backend". The same goes
  for any other machine-specific project name that the prompt file itself does not mention.
- No requirement, matrix or design may assume a closed list of harnesses (decision 17).

## 4. Sources

- For external products (CLIs, SDKs, auth, terms of service, host plugin APIs) work from **current
  official documentation**; these change monthly and recalled facts go stale. Today is 2026-09-29.
- Fleet-internal facts about dsh, prime, pi and the host setup come from the qmd MCP server
  (`mcp__qmd__query`, load it with ToolSearch) or the `qmd-recall` skill.
- Always write the origin of an as-is ID: `028 FR-012`, `011 SC-003`, `002 FR-040`. A bare `FR-012`
  is ambiguous because all three specs number from 001.
- Where a spec and the code disagree, the code at the baseline commit is the truth
  (Specstride `9cab15d`, mixture-of-loops `9c88f86`, Lisa per R1's ruling; default local `main` `363e6a3`
  with the as-is baseline `76adfdc`).

## 5. Output

Write your report to the path in your assignment, using exactly this template:

```
# R<n> — <topic>
## Prior art consulted            (local files read; what is reused, extended or contradicted)
## Questions answered            (each question, then its answer)
## Findings                      (each claim tagged and evidenced, see below)
## Version/date pins
## Options compared              (when a choice is involved: options × criteria)
## Recommendation                (one; with confidence)
## Matrix rows                   (rows for the harness or host capability matrix, if any)
## Open questions / risks
```

Every claim carries exactly one tag:

| Tag | Meaning | Evidence required |
|---|---|---|
| `verified-doc` | Read in official documentation | URL and access date |
| `verified-local` | Observed on this machine | `file:line`, or the command and its output |
| `inferred` | Reasoned from other facts | The facts it rests on |
| `unverified` | Could not be confirmed | What was tried |

Harness Capability Matrix columns (use these when you contribute a row): harness; tested or
unverified; detect/version command; headless invocation; stream format; TS SDK; auth modes; tier;
proposer?; tool-less critic?; quota signal; terms status; version pin + verified-on; delivery wave.

Host Capability Matrix columns: host; skills; hooks; background processes; UI surfaces; packaging; evals.

Be concrete and complete; a report is a working document for an architect, not a summary. Cite
line numbers you have actually looked at (grep them; do not cite from memory).

## 6. What to send back as your final message

A digest of **at most 250 words**:

1. the recommendation and its confidence;
2. anything that belongs in `DECISIONS-PENDING.md` (evidence, the default to proceed on, what changes
   if the owner rules otherwise);
3. the matrix rows you contribute (harness or host), or "none";
4. any paid probes you ran;
5. the path of the report you wrote.
