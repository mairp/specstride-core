# Feature Specification: Presenter

**Feature Branch**: `145-presenter` (a label: Spec Kit creates no branch in this repository; the directory is `specs/145-presenter`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 145-presenter, the second part of feature 119-front-door-and-presenter: the presenter that turns one run's event stream into timeline, card, plain and quiet lines; the banner with its gate rail; the theme with its colour depth, background and glyph rules; the start-up record and the halt banners that the engine's foreground call prints; and the live-mode rules."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 119, group G3), `STAGE-B-RULES.md`, `STAGE-B-SPLIT-PROMPT.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (principles V, XVIII, XIX), feature 100 (`specs/100-specstride/`), feature 141 (`specs/141-parity-oracle/`), and the Specstride baseline at `9cab15d` (`lib/present.py`, `lib/banner.py`, `lib/theme.py`, the engine script).

## What this feature is

The presenter shows a person what a run is doing. It reads one run's events and prints lines for a terminal: a scrolling timeline, a live card, a plain listing or raw JSON lines. The banner prints the start-up splash with a rail of gate posts, one per phase. The theme decides colour depth, background and glyphs from the terminal and the environment. The engine's foreground call uses all three to print its start-up record, its halt banners and its live view. No run depends on any of it (Principle V).

The feature was part of `119-front-door-and-presenter` and was split from it. The front door, the inspection verbs and the output modes stay there. The presenter's lines are compared with the baseline in compatibility output (fixture families FX-01, FX-02 and FX-40); the presenter's default-output forms follow the rules of annex G §G.2.

**In scope**: the presenter (modes, options, detail levels, event source, timeline lines, plain and quiet output, rail, totals, heartbeat, card, following); the theme (colour depth, background, ASCII glyphs); the banner (call, options, environment, text, tiers, animation); the start-up record and the halt banners of the engine's foreground call; the live-mode rules.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The front door, the inspection verbs, `status`, usage and exit codes | 119 |
| The verb `watch` as a command (it calls the card of this feature) | 119 |
| The compatibility projection that the presenter reads | 144 (split from 111) |
| The terminal follower as a later product, the web viewer | 121, Wave 2 |
| The line grammar | 100 |
| The events themselves, their types and fields | 111 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A person watches a run in a terminal (Priority: P1)

A person starts a run in the foreground, or opens the live card in a second terminal. They see the banner, the timeline of the run, the gate rail and a live card, and the colours respect their terminal and their environment.

**Why this priority**: The look is a parity surface (FX-40) and the first thing a consumer sees.

**Independent Test**: On a pseudo-terminal, FX-40 scenarios `banner`, `timeline-live`, `colour-detected` and `colour-never` print the escape sequences of the baseline; with `NO_COLOR` set the output holds none.

**Acceptance Scenarios**:

1. **Given** `NO_COLOR` set and no `--color` argument, **When** the presenter renders, **Then** the colour depth is `none` (F145-FR-012).
2. **Given** a terminal narrower than 40 columns, **When** the banner prints, **Then** the tier is `line` (F145-FR-017).
3. **Given** a presenter that crashes or a closed pipe, **Then** the run is unchanged and the presenter exits 0 on a closed pipe (F145-FR-001).

---

### User Story 2 - The port prints the lines of the baseline (Priority: P1)

An owner of the parity oracle runs the baseline and the port on the same fixture. The presenter's lines, the start-up record and the halt banners are equal after normalization.

**Why this priority**: Parity binds every release (Principle XVIII, ruling 32).

**Independent Test**: The parity tests compare `stdout` and `stderr` on FX-01 and FX-02 for the engine's lines and on FX-28 and FX-40 for the presenter.

**Acceptance Scenarios**:

1. **Given** a verdict REJECTED, **When** the timeline renders it, **Then** the line is `<HH:MM:SS>  ✗ REJECTED phase <p> (attempt <n>)` with the reason when one exists (F145-FR-005).
2. **Given** an engine start on a terminal, **Then** the banner, then the start-up record with its labelled lines (F145-FR-018).
3. **Given** the profile `parity`, **Then** the presenter prints no line that has no as-is equivalent (annex G §G.2, F100-FR-176).

---

### User Story 3 - The engine tells why it halted (Priority: P2)

When the critic does not answer, or a phase oscillates, the person sees a framed banner with the cause and the ways to resume.

**Why this priority**: The halt banner is the one place where the engine explains itself to a person.

**Independent Test**: Scenarios of FX-01 and FX-02 that end in each halt compare the banner lines.

**Acceptance Scenarios**:

1. **Given** a critic that does not answer, **Then** the banner starts `# HALT — the critic is not answering (exit 1).` (F145-FR-019).
2. **Given** a grounding gap in the run's events, **Then** the hypothesis is `TOOLING BLIND SPOT` (F145-FR-019).

---

### Edge Cases

- The events file holds a torn or non-JSON line: the presenter skips it silently (F145-FR-006, F145-FR-011).
- The events link is retargeted to the file of a new engine start while following: the presenter reopens it and shows the `new run detected` line (F145-FR-003, F145-FR-011).
- A terminal that cannot be sized gets 100 columns by 24 rows in the presenter and 80 by 24 in the banner (F145-FR-010, F145-FR-015).
- A stop request is pending while a live view runs: the heartbeat says so (F145-FR-008).
- `SPECSTRIDE_BANNER=off`: the banner prints nothing and the live rail is off (F145-FR-016).
- `CI` set or `TERM=dumb`: no animation (F145-FR-016).

## Requirements *(mandatory)*

### Functional Requirements

Every requirement follows `STAGE-B-RULES.md` section 4. "Compatibility output" and "default output" are the two modes of feature 100 annex G §G.2. A line quoted between backticks is the literal line of the baseline; a leading space in a literal line is part of it. The presenter, the banner and the theme are not public commands (annex G §G.1, F100-FR-171). Their flags are the options of the internal call, with the names, values and errors of the baseline; an as-is exit code is the `exit_code` field of the call's result record.

- **F145-FR-001**: The presenter MUST be a pure consumer of one run's event stream and MUST never affect the control flow of a run. A failure of the presenter, a missing presenter and a closed output pipe MUST leave the run unchanged; on a closed pipe the presenter MUST end with code 0 after redirecting its output to the null device, and it MUST swallow an interrupt (Ctrl-C) and end normally.
  - origin: B-1328; B-1366; B-1407
  - disposition: translated
  - test: PT-145-C-096-*; PT-145-C-100-*; PT-145-C-103-*
  - divergence: DV-066

- **F145-FR-002**: The presenter MUST offer the options of the baseline: `--mode timeline|card|plain` (default `timeline`; any other value is a usage error with code 2); `--follow`; `--detail milestones|tools|full` (default `tools`); `--events PATH`, default the current events of the workspace; `--workdir DIR` (default `.`), which locates the events when `--events` is absent; `--no-color`, which forces the colour depth `none`; `--debug`, which prints an event the timeline does not know as a dim `<ts>  · <event> <json of the other keys>`; and `--quiet`, which prints each parsed event as one JSON line and takes precedence over `--mode`. The variable `SPECSTRIDE_LIVE_DETAIL`, alias of the key `output.liveDetail`, MUST supply the default of `--detail`; an invalid value falls back to `tools`. Detail `milestones` MUST hide `iter_start`, `agent_init`, `agent_tool`, `agent_diagnostic`, `agent_observability`, `telemetry_delivery` and `agent_result`; a successful `telemetry_delivery` MUST show only at detail `full`, a failed one at `tools` and above; an event with any other name MUST produce no timeline line unless `--debug` is set.
  - origin: B-1329; B-1330; B-1331; B-1332; B-1333; B-1334; B-1335; B-1336; B-1337; B-1386; B-1387; B-1388
  - disposition: translated
  - test: PT-145-C-097-*; PT-145-C-098-*; PT-145-C-103-*
  - divergence: DV-066; DV-027
  - parity: as at the baseline (default `tools`) (row 71 of annex X §X.7)

- **F145-FR-003**: In compatibility output the timeline MUST render the milestone events of the run as one line each, `<HH:MM:SS>  <text>`, with these texts. The fields read are named; a missing field reads `?`.

  | Event | Text |
  |---|---|
  | `_reopen` (made by the follower, never in the file) | `── new run detected — following it ──`, without a timestamp |
  | `run_start` | `┏ run start — <phases> phases · <proposer>→<critic> · resume @ phase <resume>` |
  | `phase_start` | `◆ phase <phase>/<total>`, and ` — <title>` when a title exists |
  | `proposer_start` | `✱ proposer working — phase <p>, attempt <attempt>, <backend>` |
  | `accelerator_start` | `✚ accelerator acting on the hint — phase <p>, attempt <attempt>, <backend>`, and ` · <criteria>` when present |
  | `acceleration_note` | `↦ acceleration note written (phase <p>, attempt <n>)` |
  | `iter_start` | `↻ pass <iter>/<max_iter>` (not at detail `milestones`) |
  | `evidence_writing` | `↑ evidence being written (<tool> <target>)`, and ` · <match or detection_reason>` when present |
  | `evidence_written` | `◇ evidence → <file>  (<iters> iter)` |
  | `evidence_present` | `◇ evidence present (resume → critic)` |
  | `diagnostician_trigger` | `! diagnosing phase <p>, after attempt <n> — writing a hint for the next pass` |
  | `attempt_archived` | `↦ archived rejected attempt <attempt> (phase <p>)` |
  | `phase_done` | `◆ phase <p> done (attempt <n>)` |
  | `git_checkpoint` | `⎇ git checkpoint (phase <p>)` |
  | `run_stop`, `reason=stop_flag` | `■ stopped cleanly at phase <p> — resume with: specstride resume` |
  | `run_stop`, any other reason | `■ halt — <reason> (phase <p>)` |
  | `run_end` | `■ run complete — <outcome>` |

  - origin: B-1338; B-1339; B-1340; B-1341; B-1342; B-1343; B-1344; B-1348; B-1353; B-1354; B-1355; B-1360; B-1361; B-1362; B-1363; B-1364; B-1365
  - disposition: translated
  - test: PT-145-C-099-*
  - divergence: DV-007

- **F145-FR-004**: In compatibility output the timeline MUST render the events of the agent as follows. `agent_init` (not at `milestones`): `● agent up — <provider> / <model>` (or the backend when neither exists) and, when any exists, ` (session <session_id>, schema v<schema_version>, <tools> tools, updated)`. `agent_tool` (not at `milestones`): by `status`, `… <tool> progress`; for `end`, `✓ <tool> done` or `✗ <tool> failed` by `is_error`, with the result summary; otherwise `<glyph> <tool>` with ` start` when the status is `start`; then the target and, at `end`, the duration. `agent_text`, at detail `full` only: `│ final <text>` or `│ partial <text>` by `final_fragment`. `agent_diagnostic` (not at `milestones`): `! <code> — <message>`, red for severity `error` or `fatal`, otherwise yellow. `agent_observability` (not at `milestones`): `◈ observability <mode>`, and ` — <reason>`, the provider format, `signals: <signals>` and the role; green for `structured`, red for `degraded`, yellow otherwise. `telemetry_delivery`: `✓ sink <sink> <status>` or `! sink <sink> <status>` with the reason, `HTTP <http_status>`, the batch id and `<event_count> events`; a status other than `accepted`, `ok` or `success` counts as failed. `agent_result` (not at `milestones`): `◦ pass done` or `◦ pass <status>` (an error when `is_error` or the status is `error`, `timeout`, `cancelled` or `degraded`), with `$<cost>` to two decimals (`cost`, else `cost_usd`), tokens out and in, the duration, turns (`turns`, else `num_turns`), the reason (`reason`, else `reason_code`) and the source. Parts are separated by ` · `.
  - origin: B-1345; B-1346; B-1347; B-1349; B-1350; B-1351; B-1352
  - disposition: translated
  - test: PT-145-C-099-*
  - divergence: DV-007

- **F145-FR-005**: In compatibility output the timeline MUST render `critic_start` as `┿ critic judging phase <p>, <provider>`; a `verdict` of `APPROVED` as `✓ APPROVED phase <p>`; a `verdict` of `REJECTED` as `✗ REJECTED phase <p> (attempt <n>)` with ` — <reason>` when a reason exists; a `verdict` with any other result as `✗ MALFORMED phase <p> (attempt <n>)` in yellow. The event `reject` MUST be consumed and never rendered.
  - origin: B-1356; B-1357; B-1358; B-1359
  - disposition: translated
  - test: PT-145-C-099-*
  - divergence: DV-007

- **F145-FR-006**: The plain mode MUST print one line per event, `<HH:MM:SS>  <event padded to 18> <k=v ...>`, with the keys `time`, `ts`, `event`, `task`, `backend` and `run_id` left out; an `agent_observability` event MUST print `<HH:MM:SS>  observability <mode>`, ` — <reason>` when present, and the other `k=v` pairs after two spaces. The plain mode MUST print `────── new run ──────` when the followed link is retargeted to the file of a new engine start. Lines that are not valid JSON MUST be skipped silently. The quiet mode MUST drop lines that are not valid JSON and, with `--follow`, MUST print the synthetic `{"event": "_reopen"}` object when the link is retargeted.
  - origin: B-1368; B-1369; B-1378; B-1389; B-1391; B-1393
  - disposition: ported
  - test: PT-145-C-102-*; PT-145-C-103-*

- **F145-FR-007**: The gate rail MUST be seeded from `run_start.states` (a comma list of `A`, `R`, `C`, `P`) and `run_start.phases`; without `states` every phase starts pending. A `verdict` of `REJECTED` MUST mark the phase `R` and re-stamp the rail with `attempt <attempt>/<max_rejects>` (field `max_rejects`); MALFORMED changes nothing. `phase_done` MUST mark the phase approved and re-stamp the rail with the time since `run_start`; `run_end` MUST mark every phase from 1 to the total approved. Two consecutive `run_stop` events with the same rail states MUST stamp the rail once. The status tail of the rail is `<approved>/<total> approved`, followed by ` · <extra>` when there is one. A re-stamped rail MUST be indented 10 columns, never be wider than the terminal, and under 40 columns collapse to a one-line rail or a summary.
  - origin: B-1370; B-1371; B-1394; B-1395; B-1396; B-1397; B-1398
  - disposition: ported
  - test: PT-145-C-102-*; PT-145-C-103-*

- **F145-FR-008**: On `run_end`, the timeline on a terminal that follows MUST print the totals line `  Σ <$cost> · <tokens> tok out · <n> pass · <elapsed>`. The totals MUST add the cost of each `agent_result` (`cost`, else `cost_usd`), its `output_tokens` and `input_tokens`, and count one pass per `agent_result`. After 2.0 seconds without a printed line, on a terminal in follow mode, a heartbeat line MUST be drawn in place, `<spinner><pulse> <activity> · <dwell>  · run <totals>`, and refreshed every 0.25 seconds; while a stop request is pending its status MUST be `‖ stop requested — finishing current pass…`. A stop request is pending when the stop request of the workspace exists (`inbox:stop`) or, as at the baseline, when the stop flag exists in the events file's directory or two levels above it. The activity text MUST follow `run_start`, `phase_start`, `proposer_start`, `accelerator_start`, `iter_start`, `agent_tool`, `agent_text`, `evidence_writing`, `agent_diagnostic`, `critic_start`, `verdict`, `run_stop` (`stopped`) and `run_end` (`complete`).
  - origin: B-1367; B-1372; B-1373; B-1374; B-1384; B-1385
  - disposition: ported
  - test: PT-145-C-101-*; PT-145-C-102-*; PT-145-C-103-*
  - divergence: DV-006

- **F145-FR-009**: The card mode MUST clear the screen (`ESC[2J ESC[H`), replay the whole file once, then follow and redraw whenever events arrive or every 0.5 seconds. The card MUST show the gate rail; `  phase <cur>/<total>` with `(attempt n)` only when the attempt is not 1, and the title cut to 40 characters; an activity line with a spinner; `  run: <totals>`; a divider; a rolling feed of at most 200 lines, dropping a line identical to the previous one and showing the last `max(4, rows - 9)`; and the footer `  Ctrl-C to detach — the run keeps going`. The outcome line MUST be `■ STOPPED — resume with: specstride resume` for `run_stop` with `stop_flag`, `■ HALT: <reason>` for any other stop, and `■ <outcome>` (default `done`) for `run_end`. A new `run_start` MUST clear the outcome. The card MUST force colour on even off a terminal unless `NO_COLOR` is set or `--no-color` is given.
  - origin: B-1375; B-1376; B-1377; B-1401; B-1402; B-1403; B-1404; B-1405
  - disposition: ported
  - test: PT-145-C-102-*; PT-145-C-103-*
  - assumption: CQ-100

- **F145-FR-010**: The presenter MUST use these forms. Tool glyphs by tool name, case-insensitive: `read` `◎`, `write` `✚`, `edit`, `multiedit`, `notebookedit` `✎`, `bash` `❯`, `grep`, `glob`, `ls` `❍`, `task`, `agent` `»`, `webfetch`, `websearch` `⇆`, the task-list tools `≡` (muted), names that begin `mcp__` `◇`, anything else `›`. The timestamp is the 8 characters after `T` of the event's `time`, else the local time of `ts`, else `--:--:--`. Token counts are `<n>`, `<n.n>k` from 1,000 and `<n.n>M` from 1,000,000; durations are `<s>s`, `<m>m<ss>s` or `<h>h<mm>m`. An event value is true when it is `true` or one of the strings `1`, `true`, `yes`, `error`, `failed`, `failure`, case-insensitive. The size of a terminal that cannot be detected is 100 columns by 24 rows. Without a terminal or without `--follow` the timeline MUST print lines and rails only, with no spinner, no motion and no totals line.
  - origin: B-1380; B-1381; B-1382; B-1383; B-1399; B-1400
  - disposition: ported
  - test: PT-145-C-103-*

- **F145-FR-011**: Without `--follow` a missing events file MUST end the presenter silently; with `--follow` the presenter MUST wait, polling every 0.3 seconds, until the file exists. In follow mode it MUST poll every 0.4 seconds and, when the identity of the followed file changes (a link retargeted or a file replaced), MUST reopen the new file from the top and emit the synthetic `_reopen` event.
  - origin: B-1390; B-1392
  - disposition: ported
  - test: PT-145-C-103-*

- **F145-FR-012**: The colour depth MUST be resolved in this order. An explicit argument `never` gives `none`; `always` gives the depth of the terminal whatever the terminal, `NO_COLOR` or `FORCE_COLOR`. Otherwise `NO_COLOR`, read as at the baseline (B-1411): set and non-empty it gives `none`, and it is checked after the caller's `--color`; `FORCE_COLOR`, read as at the baseline (B-1412), set and non-empty enables colour on a stream that is not a terminal (`NO_COLOR` is checked first). The four variables of the platform `NO_COLOR`, `FORCE_COLOR`, `TERM` and `COLORTERM` stand in the alias table of feature 110 (`specs/110-config-and-terms/contracts/alias-table.tsv`) and map to no key; `TERM=dumb` or a stream that is not a terminal gives `none`. The depth of the terminal is `truecolor` when `COLORTERM` is `truecolor` or `24bit`, case-insensitive; `256` when `TERM` contains `256color`; else `16`. Last, `SPECSTRIDE_COLOR` (`none`, `16`, `256`, `truecolor`), alias of the key `output.color`, overrides the result even over `--color` and `NO_COLOR`; other values are ignored. The 16-colour codes by role, dark and light background, MUST be accent 95/35, approved 32/32, warn 33/33, reject 31/31, muted 90/2; the roles are `brand`, `accent`, `approved`, `warn`, `reject`, `muted`, and `brand` uses the terminal's own foreground (code 39). Depth `256` MUST quantize each role's hex colour to the nearest xterm-256 index; `truecolor` MUST emit `38;2;r;g;b`.
  - origin: B-1409; B-1410; B-1411; B-1412; B-1413; B-1414; B-1421; B-1422; B-1424; B-1425
  - disposition: translated
  - test: PT-145-C-105-*; PT-145-C-107-*
  - divergence: DV-027
  - parity: as at the baseline, the variable unset (row 73 of annex X §X.7)

- **F145-FR-013**: The background MUST be resolved without asking the terminal unless the stream is a terminal. `SPECSTRIDE_BANNER_BG` set to `dark` or `light`, alias of the key `output.bannerBg`, fixes the background. Otherwise `COLORFGBG` counts: its last `;` field, when numeric, means light from 11 and dark below. `TMUX` or `STY` set gives `dark` with no query. On a terminal the theme MUST write the query `ESC ] 11 ; ? ESC \` to the terminal device in raw mode, wait up to 0.2 seconds and take a luminance of 128 or more as light; the fallback is `dark`. The presenter MUST never query the terminal: it uses `SPECSTRIDE_BANNER_BG` or `COLORFGBG`, else `dark`. When the variable is unset and standard output is a terminal, the engine's foreground call MUST detect the background once and pass it to the banner and the presenter. The internal call `bg` MUST print `dark` or `light` once, treating the stream as interactive when standard input or standard error is a terminal; any other argument MUST give code 1 with the usage line of the baseline, `usage: theme.py bg`, in which the file name `theme.py` is replaced by the logical component name.
  - origin: B-0069; B-1406; B-1408; B-1415; B-1416; B-1417; B-1420; B-1423
  - disposition: translated
  - test: PT-145-C-007-*; PT-145-C-103-*; PT-145-C-104-*; PT-145-C-105-*; PT-145-C-106-*; PT-145-C-107-*
  - divergence: DV-027; DV-066
  - status: unverified (check: the query of the terminal background on a macOS terminal; verified-on: —; pin: —)

- **F145-FR-014**: Every glyph MUST map to ASCII when `SPECSTRIDE_ASCII` is set to anything but empty or `0` (alias of the key `output.ascii`), and when `LC_ALL`, else `LC_CTYPE`, else `LANG` is non-empty and does not contain `utf8` or `utf-8`. The substitutions are: track `=`, ahead `-`, gate `+`, tip `>`, approved `ok`, rejected `x`, current `>`, pending `.`, times `x`, arrow `->`.
  - origin: B-1418; B-1419; B-1426
  - disposition: translated
  - test: PT-145-C-105-*; PT-145-C-107-*
  - divergence: DV-027

- **F145-FR-015**: The banner call MUST print the start-up splash (mark, name, caption and the gate rail) sized to the terminal, and MUST offer these options: `--states A,R,C,P,...` (first letter, case-insensitive; an unknown letter becomes `P`, a missing state is pending, at most 40 used); `--phases N` (clamped to 1..40); `--plain` (full-width ASCII with no escape code, the copy for the run log); `--bg dark|light`; `--color always|never|auto` (default `auto`); `--no-motion` (the final frame only); `--rail-only` (the two rail lines only); `--preview` (every tier, background and depth, the motion frames and the plain copy, ignoring `SPECSTRIDE_BANNER=off`); and `--cols N` and `--rows N`, hidden from help, which override the detected size (default 80 by 24). The banner MUST exit with code 0 on every path, including when it is switched off and on a closed pipe.
  - origin: B-1151; B-1152; B-1153; B-1154; B-1155; B-1156; B-1157; B-1158; B-1159; B-1160; B-1165
  - disposition: translated
  - test: PT-145-C-081-*; PT-145-C-082-*; PT-145-C-084-*
  - divergence: DV-066

- **F145-FR-016**: `SPECSTRIDE_MOTION=0` MUST turn animation off; so MUST a non-empty `CI` and `TERM=dumb`, and animation MUST need a terminal. `SPECSTRIDE_BANNER` set to `off`, `0`, `false` or `no`, case-insensitive, MUST make the banner print nothing and MUST also turn the live rail off. `SPECSTRIDE_LIVE_RAIL` set to the same values MUST suppress the re-stamps of the rail: the banner's rail-only call prints nothing and the live timeline draws no rail. The keys of these variables are `output.motion`, `output.banner` and `output.liveRail`.
  - origin: B-1161; B-1162; B-1163; B-1164
  - disposition: translated
  - test: PT-145-C-083-*
  - divergence: DV-027

- **F145-FR-017**: The splash text MUST be the name `specstride`, the description `From specs to tested code.` and the caption `Every step, signed off.` The plain rail labels MUST be `<n> ok`, `<n> rej`, `<n> now`, `<n> -` for approved, rejected, current and pending; the tight form uses `+`, `x`, `>`, `.`. The width tiers MUST be `full` from 72 columns, `compact` from 40 to 71, and `line` (one line) under 40 columns or under 14 rows. The splash animation MUST be 9 frames at 75 ms; only the two rail lines are redrawn, with the cursor hidden and synchronized-output escapes, and the cursor and the attributes restored on exit and on interrupt or termination. With neither `--phases` nor `--states` the rail MUST be decorative: five gate posts in the brand colour without labels. A rail that cannot fit the width MUST become a summary `<glyph><frontier>/<total>`, or `✓ n/n` when all are approved; in the one-line rail, runs of 3 or more equal states MUST collapse to `<glyph>×<count>`. Off a terminal the banner MUST fall back to plain ASCII unless `--color always` is given; plain output is at least 80 columns wide and always the `full` tier.
  - origin: B-1166; B-1167; B-1168; B-1169; B-1170; B-1171; B-1172; B-1173
  - disposition: ported
  - test: PT-145-C-085-*; PT-145-C-086-*

- **F145-FR-018**: The engine's foreground call MUST print, in compatibility output, at its start: when standard output is a terminal, the banner sized with the number of phases and the list of rail states, and a plain copy of the banner MUST always be appended to the run log; if the banner is missing the fallback title `specstride: from specs to tested code` MUST go to standard output and the run log. Then the start-up record, `specstride orchestrator start <ISO time>` followed by labelled lines, each after two spaces: `workdir  :`, `specs    : <path>  (<n> phases: <numbers>)`, `feature  : <slug>   (state: <rel>/)`, `proposer :`, `critic   :`, `max-rej  : <n>   max-iter/phase: <n>`, `timeouts : proposer <s>s  critic <s>s   wall: <m>min`, `git      :`, `telemetry:`, `verify   :`, `resume   :`, `run_id   :`, and `stop with: touch <stop request>`. The `resume` line MUST read `phase <N>`, suffixed ` (--start-phase)` when overridden, or `phase <all approved>`. In live mode the terminal MUST get instead a short header of `  feature  <slug>`, `  agents   proposer <p>, critic <c>` and `  log      <run log path>`. The plain rail MUST be appended to the run log at each approved phase, each rejection judged by the critic, every stop and the end of the run. The first word of the start-up line names the logical component `engine` in place of the baseline's script name where the baseline's text names a file. The `stop with:` line names the location of `inbox:stop`, which normalization rule N-02 maps to the logical name.
  - origin: B-0195; B-0196; B-0197; B-0198; B-0200; B-0201
  - disposition: ported
  - test: PT-145-C-012-*
  - divergence: DV-066; DV-006

- **F145-FR-019**: When the engine halts because the critic does not answer, the foreground call MUST print a banner framed by lines of `#`: `# HALT — the critic is not answering (exit 1).`, with the critic, its time limit and three ways to resume. When a phase oscillates it MUST print `# HALT — phase <N> is OSCILLATING (exit 2). Not converging.` with the criterion, the number of reappearances and the location of the attempt history. The hypothesis MUST be `TOOLING BLIND SPOT`, naming the `paths` of the last `grounding_gap` event, when this run's events hold any `grounding_gap` event of any phase, and otherwise `likely an under-specified acceptance criterion`.
  - origin: B-0229; B-0230; B-0335
  - disposition: ported
  - test: PT-145-C-012-*; PT-145-C-013-*

- **F145-FR-020**: The live timeline MUST be governed as follows. `--live` MUST force the inline scrolling timeline in this terminal and `--no-live` MUST force the raw output even on a terminal. `SPECSTRIDE_LIVE` (`auto`, `true` or `false`, default `auto`), alias of the key `output.live`, MUST control it, and the flags win. `auto` MUST resolve to true only when standard output is a terminal and the presenter exists. In live mode one background presenter MUST render the timeline of the run's events with `--follow` and MUST be ended when the engine exits after a grace of 0.6 seconds. The run log MUST be appended to only in live mode by the engine's own lines, and otherwise the lines MUST go to standard output and the run log; the terminal MUST always get the lines the baseline sends to it. Raw output of the proposer, the critic and the verification gate MUST go to the run log only in live mode, and to the terminal and the run log otherwise. The rail state list MUST have one letter per phase in spec order: `A` approved, `R` rejected (a feedback record exists and no approval), `C` the phase in flight, `P` pending.
  - origin: B-0029; B-0030; B-0045; B-0261; B-0262; B-0264; B-0265; B-0266
  - disposition: ported
  - test: PT-145-C-006-*; PT-145-C-007-*; PT-145-C-013-*
  - parity: `auto` as at the baseline (row 70 of annex X §X.7)

- **F145-FR-021**: Colour MUST be off in every capture of the oracle (rule N-21), and a fixture that tests colour MUST compare the escape sequences as written. In default output the theme MUST resolve the depth `none` for the front door's output, so that the front door prints no escape sequence, when `NO_COLOR` is set, when the stream is not a terminal, and in `--json` output (the flag itself stays with 119).
  - test: CT-145-1

- **F145-FR-022**: In compatibility output the presenter MUST take its events from the run's events in the as-is vocabulary: the compatibility projection of feature 100 annex C §C.10 (`run:<runId>:events-legacy`), and it MUST never read the primary stream for a line whose text the projection fixes. In default output the presenter MUST take its milestones from the primary stream, and only by the closed fields of the event envelope.
  - divergence: DV-007
  - test: CT-145-2
  - ep: EP-08 `specstride.event-sink/1` (consumes)
  - assumption: CQ-101


### Key Entities

| Entity | What it is | Annex |
|---|---|---|
| Presenter | The pure consumer that renders one run's events as timeline, card, plain or quiet lines | this feature |
| Banner, theme | The start-up splash with its gate rail; the colour depth, background and glyph rules | this feature |
| Rail | The row of gate posts, one per phase, with the states `A`, `R`, `C`, `P` | this feature |
| Detail level | How much of the timeline is shown: `milestones`, `tools`, `full` | this feature |
| Start-up record | The labelled lines the engine's foreground call prints at its start | this feature |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F145-SC-001**: Colour rules. For every combination of `--color`, `NO_COLOR`, `FORCE_COLOR`, `TERM`, `COLORTERM` and `SPECSTRIDE_COLOR` in the table of the test, the depth chosen equals the depth of F145-FR-012; 100 per cent of the cases.
- **F145-SC-002**: Parity. In compatibility output the oracle reports 0 results `different` for the presenter's lines on FX-01, FX-02 and FX-28, and for FX-40.
- **F145-SC-003**: Best effort. With the presenter killed, absent or writing to a closed pipe, 0 runs of the fixtures change their outcome, exit code or state files.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| The CLI is one binary named `specstride` | Decision 19; R3 |

What belongs in the plan and not here: libraries and their versions, the package and file layout, the physical paths behind the logical names, the test runner, bundling, and the spelling of internal functions.

## Extension points

This feature implements no extension point. It consumes one.

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-08 | `specstride.event-sink/1` | consumes | The compatibility projection is the source of the presenter's as-is events (F145-FR-022) |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Commands of protocol 1: the presenter, banner and theme are not public commands | protocol 1 | annex G §G.1, F100-FR-171 |
| Output modes; line grammar | protocol 1 | annex G §G.2, §G.3, F100-FR-175, F100-FR-176 |
| Event sink and compatibility projection | `specstride.event-sink/1` | annex C §C.10, F100-FR-105 |
| Event envelope | `specstride.event/1` | annex X §X.1 |
| State layout, logical names (`inbox:stop`, events, engine log) | `specstride.layout/1` | annex B §B.5, F100-FR-053 |
| Redactor | `specstride.redaction/1` | annex X §X.4 |
| The `parity` profile, closed sets, normalization rules N-02, N-15, N-21 | `specstride.profile/1` | annex X §X.6, §X.7, §X.8 |
| Layering: a boundary that is not observed is a call whose result record holds the as-is code | — | annex A §A.2, F100-FR-006 |
| Threat model | — | Annex X §X.9: T-12 (the rendering half; the byte caps stay with 119) |

Fixture families of feature 141 cited: FX-01 and FX-02 (the engine's lines), FX-28, FX-40 (rendering on a terminal; the traceability files name FX-28 for the items that need one, and both citations are valid).

Feature 100 holds no contract for the presenter, the banner or the theme; the front-door part of the split (`119-front-door-and-presenter`) calls the presenter's card and plain forms. Neither part cites the other.

## Rows of the `parity` profile

This feature adds no switch that changes behaviour under the profile. It reads row 18 (`output.compat`) and row 19. The options below have their final rows of annex X §X.7; feature 110 owns the spelling of every key.

| # | Switch | Key | Default | Under `parity` | Owner | Register row |
|---|---|---|---|---|---|---|
| 70 | Live timeline | `output.live` | `auto` | `auto` | 145 | DV-027 |
| 71 | Live detail | `output.liveDetail` | `tools` | `tools` | 145 | DV-027 |
| 73 | Colour depth override | `output.color` | unset | unset | 145 | DV-027 |
| 74 | Banner | `output.banner` | on | on | 145 | DV-027 |
| 75 | Animation | `output.motion` | on where a terminal allows it | as at the baseline | 145 | DV-027 |
| 76 | Live rail | `output.liveRail` | on | on | 145 | DV-027 |
| 77 | Background override | `output.bannerBg` | unset | unset | 145 | DV-027 |
| 78 | ASCII glyphs | `output.ascii` | off | off | 145 | DV-027 |

Row 72 (`output.verbose`) stays with the front door.

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 145. All are closed by design.

| Closed set | Members | Unknown value |
|---|---|---|
| Presenter modes | `timeline`, `card`, `plain` | Usage error, code 2 |
| Detail levels | `milestones`, `tools`, `full` | From the variable: `tools`; from the flag: usage error, code 2 |
| Colour depths | `none`, `16`, `256`, `truecolor` | From `SPECSTRIDE_COLOR`: ignored |
| Colour arguments | `always`, `never`, `auto` | Usage error |
| Backgrounds | `dark`, `light` | `dark` |
| Colour roles | `brand`, `accent`, `approved`, `warn`, `reject`, `muted` | Not applicable |
| Banner width tiers | `full`, `compact`, `line` | Not applicable: derived from the size |
| Rail states | `A` approved, `R` rejected, `C` current, `P` pending | `P` |
| Live settings | `auto`, `true`, `false` | `auto` |

Open sets: event names that the timeline does not render are ignored (shown only with `--debug`).

## As-is behaviour not carried

The traceability files assign no row to this feature with the disposition `superseded-by` or `dropped`.

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| Clusters C-081 to C-086, C-096 to C-107 | as in the traceability files | F145-FR-001 to F145-FR-017 | PT-145-C-nnn-* |
| B-0029, B-0030 (C-006); B-0045, B-0069 (C-007) | ported, translated | F145-FR-013, F145-FR-020 | PT-145-C-006-*, PT-145-C-007-* |
| B-0195 to B-0198, B-0200, B-0201, B-0229, B-0230 (C-012) | ported | F145-FR-018, F145-FR-019 | PT-145-C-012-* |
| B-0261, B-0262, B-0264 to B-0266, B-0335 (C-013) | ported | F145-FR-019, F145-FR-020 | PT-145-C-013-* |

## Ids before the split

Requirements, success criteria and tests that came from `119-front-door-and-presenter`.

| Old id | New id |
|---|---|
| F119-FR-034 | F145-FR-001 |
| F119-FR-035 | F145-FR-002 |
| F119-FR-036 | F145-FR-003 |
| F119-FR-037 | F145-FR-004 |
| F119-FR-038 | F145-FR-005 |
| F119-FR-039 | F145-FR-006 |
| F119-FR-040 | F145-FR-007 |
| F119-FR-041 | F145-FR-008 |
| F119-FR-042 | F145-FR-009 |
| F119-FR-043 | F145-FR-010 |
| F119-FR-044 | F145-FR-011 |
| F119-FR-045 | F145-FR-012 |
| F119-FR-046 | F145-FR-013 |
| F119-FR-047 | F145-FR-014 |
| F119-FR-048 | F145-FR-015 |
| F119-FR-049 | F145-FR-016 |
| F119-FR-050 | F145-FR-017 |
| F119-FR-051 | F145-FR-018 |
| F119-FR-052 | F145-FR-019 |
| F119-FR-053 | F145-FR-020 |
| F119-FR-054 | F145-FR-021 |
| F119-FR-055 | F145-FR-022 |
| F119-SC-007 | F145-SC-001 |
| (new in the split) | F145-SC-002, F145-SC-003 |
| CT-119-16 | CT-145-1 |
| CT-119-17 | CT-145-2 |
| PT-119-C-081-* to PT-119-C-086-* | PT-145-C-081-* to PT-145-C-086-* |
| PT-119-C-096-* to PT-119-C-107-* | PT-145-C-096-* to PT-145-C-107-* |
| PT-119-C-006-*, PT-119-C-007-*, PT-119-C-012-*, PT-119-C-013-* (for the moved items only) | PT-145-C-006-*, PT-145-C-007-*, PT-145-C-012-*, PT-145-C-013-* |

## Repairs after the cross-feature review

Dated 2026-09-30. No id was renumbered or reused.

| Requirement or place | Item | What changed |
|---|---|---|
| F145-FR-002 | W-X-11 | `parity:` names row 71 of annex X §X.7 in place of "row proposed" |
| F145-FR-006 | W-X-06 | "retargeted to the file of a new engine start" in place of "retargeted to a new run"; the as-is literal `────── new run ──────` stays |
| F145-FR-012 | W-123-04 | `NO_COLOR` and `FORCE_COLOR` are read as at the baseline (B-1411, B-1412); the four platform variables are named to the alias table of feature 110 |
| F145-SC-002 | B-8.7 | FX-28 is named beside FX-01, FX-02 and FX-40: the traceability files prove 33 items of this feature on FX-28 (T023 follows) |
| Assumptions | B-8.7 | The compatibility projection is feature 144 |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: Are the presenter, the banner and the theme public commands? → A: No. Only `spec`, `verify` and `learn` are public; the others are internal calls with the as-is flags, and their exit codes are result-record fields. (Source: ruling 26; F100-FR-171; LR-6)
- Q: Which stream does the presenter read? → A: In compatibility output the compatibility projection, so that the as-is vocabulary of C-099 holds; in default output the primary stream. (Source: DV-007; N-12; F100-FR-105) See CQ-101.
- Q: Does the banner change under the `parity` profile? → A: No; it is as at the baseline, and the oracle runs with colour off (N-21) except on FX-40. (Source: N-21; feature 141 FX-40)
- Q: Where do the start-up record and the halt banners belong, given that the engine is another feature's? → A: Here, as content of the engine's foreground lines; the traceability files assign items B-0195 to B-0198, B-0200, B-0201 and B-0229, B-0230 to this group (B-0199 is feature 128's). (Source: `traceability-items.tsv`; brief 119 heading 2)
- Q: Is the live card the terminal follower of Wave 2? → A: No. Wave 1 has the card of the baseline; a later follower may replace it. (Source: R13; brief 119 heading 1) See CQ-100.
- Q: Which questions could the sources not answer? → A: Two, CQ-100 and CQ-101, listed under "Assumptions".

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The compatibility projection (feature 144, split from feature 111) exists when the fixtures that compare the presenter run.

Readings that the sources do not settle. Each is marked in its requirement and reported to the orchestrator.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-100 | What does the live card print in default output, and is it Wave 1 given that 121 is Wave 2? | The card of the presenter, with default-output milestones; Wave 1 until a follower replaces it | F145-FR-009 |
| CQ-101 | Does the presenter read the compatibility projection or the primary stream? | The projection in compatibility output; the primary stream in default output | F145-FR-022 |
