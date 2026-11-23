# Research: Stream seam and invocation

Summary and links only. The reports stay in `docs/ecosystem/research/`.

| Decision | Source | Result |
|---|---|---|
| Data mapping is enough for a new format | R15v P-10; R20 (stream section); architecture EP-02 | A generic mapping reader plus code readers only for `claude` and the JSONL family |
| Truthful stream, `stream.missing_terminal`, null for unknown | R14 EV-31; constitution XI | The seam synthesizes a marked terminal and never guesses |
| Hostile stream: framing only, caps | R11 T-17; R14 EV-33 | Caps are new; no source gives values; proposed 1048576 bytes, 5000 lines a second (CQ-104) |
| Usage per model call, killed passes keep partial usage | R14 EV-03, EV-16, EV-17; R27 X0 | Increments, `usageId`, `usageComplete=false`, `usage.unavailable` |
| Session ids, transcript by reference | R14 EV-02; R5 Q5 | Path and hash only |
| Terminal decides where the exit code lies | R9 F5 | Applies to prime; pi `unverified` |
| Baseline behaviour of the seam | R18 F-11; items C-146 to C-154, C-155 to C-166, C-191 to C-194 | Carried as F126-FR-001 to F126-FR-037 |
| Time use of killed passes | R21, R21v | Motivates X0: 47 per cent of passes carry cost at the baseline |
| Preserved defects | consolidation D-48, D-54 | Kept under every profile |
| A failed local append (2026-09-30) | Annex C §C.10 (local first); annex X §X.1; baseline B-2112 | The baseline shipped the event to the remote sinks. The one event writer drops it and calls no sink. Intended difference, register row `DV-115` |
| What a sink receives (2026-09-30) | Annex X §X.1; annex C §C.10; CQ-032, CQ-119 | The whole event with `ts`, `type`, `seq`. The as-is form is built under the compatibility projection only |
| Differences between harnesses (2026-09-30) | Annex A F100-FR-023; annex C §C.2, §C.5; baseline `proposer.sh:1705`, which tests the name of one harness | Conditions on the format row (`trackTerminal`), on the route and on the dialect row. At the baseline no production format row sets `track_terminal`; the row `prime-v3` sets it in the port so that the pass is correlated as at the baseline |
| Package (2026-09-30) | `specs/100-specstride/contracts/data/package-graph.json` | `@specstride/harness`, layer L1, owners 109, 124, 126, 146. No package of its own |
| SSE formats of row 31 (2026-09-30, analyze) | R20 (generic discovered harness; the DeepSeek worked example); annex X §X.6 row 31 | SSE framing in code, two data mappings over it (F126-FR-040), `unverified` until a capture; not listed under `parity` |
| How the engine calls finalization (2026-09-30, analyze) | `package-graph.json` (the core may not import `@specstride/harness`); F100-FR-235 | A plain function interface of `contracts`, proposed as F100-FR-237 |

Open: the current live shapes of the Claude stream records and of subagent records rest on documentation (R5) and are `unverified` until a recorded stream is captured. The capture is a paid probe; no unpaid test waits for it.
