# Prompt: fix the stale-lock launch blocker, end to end

Run from `/root/specstride-core`. Input: `docs/bugs/2026-11-08-launch-stale-lock.md` (the bug report).

## Ground truth (checked 2026-11-08)

- The local clone has **no remote**. `mairp/specstride-core` on GitHub is a single squashed public snapshot
  (`c03d16dc`) with **no common history** with local `main` (1066 commits). The file sets differ: local-only
  `SKILL.md`, `wiki/`, `references/`, `templates/`; remote-only `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`,
  `SECURITY.md`, `.mergify.yml`, `.gitleaksignore`, a tracked `specs/` (ignored locally).
- The repo is PR-only, and Mergify auto-merges once `lint`, `test` and `no-session-links` pass.
- The working tree carries 6 uncommitted fixes (bug report table, rows 1–6) in `launch.ts`, `complete.ts`,
  `features.ts`, `rules.ts`, `start.ts`.

## Rules

- Never expose a Claude session: no `claude.ai` URL, no `Claude-Session:` trailer, no conversation excerpt in the
  issue, commits or PR. Grep every text for `claude.ai` and `Claude-Session` before sending.
- Commits: author `mairp <86619221+mairp@users.noreply.github.com>`, `git commit -s`, conventional subject in the
  repo's style, ending with `Co-Authored-By: Claude <noreply@anthropic.com>`.
- **Do not touch local `main`** or its history. Work in a git worktree, so the main checkout and every
  untracked/ignored file in it stay put.
- Untracked/ignored safety (skill `git-reconcile-preserve-untracked`): before anything, record
  `git ls-files --others | sort` and tar every untracked/ignored file except `node_modules/` and `.build/` into
  the scratchpad; diff the list again at the end. Any loss → restore from the tar and report it.

## Steps

1. **Reconcile.** `git remote add origin https://github.com/mairp/specstride-core.git`, `git fetch origin`.
   Create worktree `../specstride-core-fix-lock` on new branch `fix/launch-stale-lock` from `origin/main`.
   Confirm the 5 touched files and `packages/pipeline/src/launch-checks/checks.ts` +
   `packages/pipeline/src/entry/lock.ts` are identical between local `HEAD` and `origin/main`, so a patch applies
   cleanly. If they differ, port by hand and say so.
2. **Issue.** `gh issue create -R mairp/specstride-core` titled
   `launch refuses already-running on a stale or foreign lock`, body = the bug report (Symptom, Root cause,
   Reproduction, Expected, Suggested fix, and the defects table). Do not use local absolute paths beyond
   those already in the report. Record the issue number N.
3. **Commit 1 — the 6 WIP fixes.** Apply `git diff HEAD` of the main checkout to the worktree. Install deps
   (`npm ci`), run typecheck and the suites of the touched packages. Fix anything they reveal. Commit as
   `fix(pipeline): six launch-path defects found launching 121-dsh-kanban` with one line per defect,
   `Refs #N`.
4. **Commit 2 — the lock fix.** Implement the report's suggested fix:
   - A lock inspector on the EP-13 provider (`entry/lock.ts`) returning
     `{ state: "held" | "stale" | "foreign" | "free", owner?, age? }`: our format (directory with `owner.json` +
     `lease.json`) → `pid` liveness via `process.kill(pid, 0)` (EPERM = alive) plus lease expiry; anything else
     named `lock` → `foreign`, parsing the orchestrator's `<run-id> <iso-time>` line when present.
   - `launch.ts` builds the context from the inspector, not `existsSync`.
   - Check 6: `held` → decision `attach` with the run it attaches to (F123-FR-022), and implement the attach path
     in the CLI (print `attached` and the run; no exit 24). `stale` → `reason=stale-lock` with owner and age;
     `foreign` → `reason=foreign-lock owner=… run=… age=…`. Both get a `next=` naming `specstride unlock --stale`.
     Never `already-running` for a dead or foreign lock. Add both reasons to the closed refusal set
     (annex X §X.6 row 13, and wherever `check:codes` reads the closed set).
   - `specstride unlock --stale`: removes only a lock that is provably not live (stale, or foreign with no live
     process), **moving** it to `.specstride/backups/lock-<timestamp>` instead of deleting it. It refuses on a held lock.
   - Dry run evaluates check 6 the same way as run.
   - Tests: live lock attaches; dead `pid` is stale; expired lease is stale; orchestrator one-liner is foreign;
     `unlock --stale` moves and refuses on held; dry run and run agree on all three.
   - Run `npm run typecheck`, `npm run lint`, `npm run check:codes`, and the touched packages' suites.
     Commit as `fix(launch): check 6 reads the lock through EP-13 and tells held, stale and foreign apart`,
     `Fixes #N`.
5. **PR.** Push `fix/launch-stale-lock`, `gh pr create` (title = commit 2 subject, body = summary of both
   commits, test evidence, `Fixes #N`), and enable auto-merge. No `do-not-merge` label.
6. **Verify and report.** Re-diff the untracked list in the main checkout. Report issue URL, PR URL, check
   status, test results, which steps were done by hand, and anything left open (bug report rows 7–14).
