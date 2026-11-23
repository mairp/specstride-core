# Research: Adapter for pi (feature 134)

Summary of what the plan rests on. The reports stay in `docs/ecosystem/research/`. Facts are dated 2026-09-29 and pinned to pi `>=0.80.6 <0.81` unless stated.

| # | Question | Decision | Rationale | Source |
|---|---|---|---|---|
| 1 | One adapter family or three bespoke adapters? | One JSONL family with a dialect table; pi is one row | New harnesses of the family become data. Ruling 32b fixes it | R9 option B; ruling 32b; annex C §C.5 |
| 2 | How does pi run headless? | Print mode with the JSON output mode, prompt on standard input | Same shape as the prime invocation of the baseline | R9 F7; brief 134 heading 4 |
| 3 | How are tools chosen for the proposer? | An allow-list, never a deny list | A tool added by a later version stays off | R9 F8, recommendation 1 |
| 4 | Continuation | By the exact session id the runtime mints, in a session directory of the phase attempt | "Most recent" is racy across attempts | R9 F10; decision 22; rulings 7, 36 |
| 5 | Containment | Ceiling C0; opt-in in user configuration; `protection=detect`; parallel units off unless `allow_detect` | pi has no sandbox, no permission mode, no prompt | R9 F8; R11 F-27, R-2; rulings 34, 38, P2 |
| 6 | Tool-less critic | Flag set: no tools, skills, context files, extensions, prompt templates, session; print mode; stdin | Flag set proven for prime, present in pi's help; unverified by run | R9 F8, recommendation 1; Principle IX |
| 7 | Proof of the critic mode | Initial record shows the minted identity and, where stated, an empty tool list. Otherwise flag set plus exact pin, recorded as weaker | Annex C §C.3 | Annex C §C.3; brief 134 heading 4 |
| 8 | Second form (read-only tools) | Not offered | pi's `--tools read,grep,find,ls` is not an operating-system sandbox | Annex C §C.3; R9 F8 |
| 9 | Project-local resources | Untrusted: never the approval option; the explicit ignore option passed | The print-mode default rests on documentation only | R9 F9; R11 F-27 |
| 10 | Auth | API key by environment from a secret reference; no auth file read; no login | Decision 6; T-35 | R9 F16; R11 |
| 11 | Terms | Software allowed-documented with API-key providers; decision is the provider's row. The Claude OAuth path is Tier 3, refused | R8v rows 37 to 40; ruling 59 | R8v |
| 12 | Quota signal | Assistant message with stop reason `error` after retry records; class from the text; reset time parsed; confidence `text` | No structured code exists | R9 F14; R14 B12 |
| 13 | Outcome of a call | The terminal record. The exit code on a provider error is unverified and not relied on | Prime exits 0 on a provider error | R9 F5, F14 |
| 14 | Usage | Per message, increments; cost null where absent | EV-03, EV-17 | R14 |
| 15 | Telemetry | Off for every process: `PI_TELEMETRY=0`, and the descriptor names the switch | The user did not opt in | R9 F17; R14 rule 7 |
| 16 | Context window | Smaller of declared and effective; none for an unknown model | A declared 300 000 once overshot an effective 200 000 and burned an attempt | R9 F18 |
| 17 | Tier ladder | None declared: null capability | Ladders are per provider and per consumer; guessing would invent | Constitution XI |
| 18 | Is `PI_OFFLINE` set? | No, until a capture shows it does not stop provider calls | Unknown effect | R9 F16 |

## Open items, each closed by a capture

| Capture | Question | Requirements that depend on it |
|---|---|---|
| 1 | Exit code of pi on a provider error | F134-FR-025 |
| 2 | Do the recorded streams of a proposer pass and of a critic call pass the shared reader? | F134-FR-023 |
| 3 | Does the initial record state the tool list and an identity? | F134-FR-019 |
| 4 | Does the exact-session-id option work in print mode with JSON output? | F134-FR-013, F134-FR-014 |

Each is a scripted capture or one small call, allowed only as an explicitly authorized probe, and logged. This feature runs none. The consumer's opt-in to no containment (rulings 34, P2) is needed by the probe of the proposer role.
