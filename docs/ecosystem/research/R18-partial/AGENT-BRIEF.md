# Behaviour-inventory extraction brief (R18 sub-task)

You are extracting an exhaustive inventory of the OBSERVABLE behaviour of a fixed set of source files.
This is a research task. You write exactly one output file (a TSV) and nothing else.

## Hard rules
- The source trees are frozen snapshots already extracted for you (read-only in spirit; do not modify them):
  - Specstride at commit 9cab15d: `/tmp/specstride-research/R18/ss/`
  - mixture-of-loops at commit 9c88f86: `/tmp/specstride-research/R18/mol/`
- NEVER read or touch `/root/specstride`, `/root/mixture-of-loops` or any other repository. Work only from the snapshots.
- Never read credential files, `.env` files with secrets, token stores. (`.env.example` in the snapshot is fine.)
- Do not run the product code, do not make model calls, do not install anything. Reading, grep, and small
  python/awk one-liners for counting are fine.
- Naming rule: `lib/backends.py` registers a backend that is NOT one of: claude, codex, dsh, gemini, copilot, pi,
  opencode, openrouter, zai, prime. Its name must NOT appear anywhere in your output. Write
  "a locally registered backend" (abbreviate `<local-backend>`) instead. If an env var or flag contains that name,
  write it with `<LOCAL_BACKEND>` substituted.
- Write only: your assigned output file under `/tmp/specstride-research/R18/raw/`.

## What counts as observable behaviour
Anything another process, a user, a test, or a supervising tool could observe or depends on:
- `cli-command`  : a subcommand / entry point
- `cli-flag`     : a flag or positional argument (with default and validation/exit on bad value)
- `env`          : an environment variable read or set/exported (with default, accepted values, effect)
- `event`        : an event name emitted to events.jsonl or a telemetry sink — list its FIELDS in the item text
- `exit-code`    : an exit code of a given process and the condition that produces it
- `stop-reason`  : a literal reason/outcome string (e.g. `run_stop reason=...`, `run_end outcome=...`, stage outcome strings, refusal reasons)
- `file`         : a file/dir/symlink written, moved, deleted, or read as an input contract (path pattern, writer, write discipline e.g. atomic)
- `output-line`  : a stdout/stderr/log line shape another tool or user relies on (labelled lines, banners, prefixes, `[DIGEST]`, `VERDICT <nonce>:` ...)
- `behaviour`    : a rule that changes outcomes and is not captured by the kinds above (ordering, limits, counters and when they reset,
                   thresholds, retries, timeouts, precedence, what is exempt from a counter, prompt content contracts, hashing rules, parsing grammars)

Be EXHAUSTIVE for your files. One row per distinct item. Every emitted event name gets its own row. Every env var gets its own row.
Every exit code per process gets its own row. Every stop reason literal gets its own row. Prefer many precise rows over few vague ones.
Do not list pure internal helper functions with no observable effect. Do not list test files.

## Coverage column
For each row say which as-is functional requirement covers it, by reading the as-is spec:
- Specstride spec: `/root/specstride-claude/old/028-as-is-specstride/spec.md` (+ `contracts/*.md`, `data-model.md`) -> cite as `028 FR-0xx`
- mixture-of-loops spec: `/root/specstride-claude/old/011-as-is-mixture-of-loops/spec.md` (+ `contracts/*.md`, `data-model.md`) -> cite as `011 FR-0xx`
Rules:
- Write the FR id only if the FR text itself states this behaviour (not merely the same topic). Several ids may be joined with `;`.
- If no FR states it but a contract/data-model file mentions it, write `none (contract: <file>)`.
- If no FR and no contract mentions it, write `none`.
- A success criterion may be cited as `028 SC-00x` / `011 SC-00x` in addition, never instead of the FR column rule above.

## Output format (strict)
A UTF-8 TSV file, one row per item, NO header, exactly 6 TAB-separated columns, no tabs or newlines inside a column:

  system <TAB> kind <TAB> item <TAB> evidence <TAB> needle <TAB> coverage

- `system`   : `SS` (Specstride) or `MOL` (mixture-of-loops)
- `kind`     : one of the kinds above
- `item`     : a precise one-sentence statement (name, default, values, effect, fields). Use backticks for literals.
- `evidence` : `path:line` relative to the snapshot root, a line you ACTUALLY looked at (e.g. `orchestrator.sh:204`). One primary citation only
               in this column. You may add further citations inside the item text.
- `needle`   : a short literal substring (6-40 chars, no tabs) copied verbatim from that exact cited line. It will be machine-checked with
               a fixed-string match against that line, so copy it exactly. Choose a distinctive piece of the line.
- `coverage` : per the coverage rules.

Before finishing, run this self-check and fix every failure (it must print 0 failures):

```
python3 /tmp/specstride-research/R18/check_rows.py <your-output-file> <ss|mol>
```

## Final message
Reply with: the output path, the row count, the checker result, and up to 10 bullet points on the most important behaviours you found
that the as-is spec does NOT cover (with file:line). Nothing else.
