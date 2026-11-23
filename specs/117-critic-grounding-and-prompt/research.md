# Research: Critic grounding and prompt (feature 117)

This file summarizes decisions and links to the research in `docs/ecosystem/research/`. It repeats
no report. No unknown of the Technical Context is left open.

| # | Decision | Rationale | Alternatives considered | Source |
|---|---|---|---|---|
| D-1 | Globs are expanded when the snapshot is built, never when citations are extracted; a match gives a presence line and no content | It is what the baseline does at `9cab15d`, and parity binds it | Expanding at extraction; excerpting matched files. Both change FX-25 | R18 F-07; R19 C-17; ruling 11; DV-019 |
| D-2 | The refusals are a real-path test against seven roots, applied to every way a path can enter the snapshot | A citation through a link or a wildcard must not reach state | A test on the cited text; a list of names | R23 IR-19; R23v V-11, IR-45; R27 IR-59; R29 PU-62; F100-FR-037 |
| D-3 | No copy of the tree; fingerprints before and after | Ruling 39; a copy loses build caches and costs disk | An immutable copy per phase gate (roadmap) | R23v V-01, IR-31; rulings 39, P7 |
| D-4 | Modification times stay as they are | Principle III names them; the leak is accepted | Coarsening times; setting one instant at application | R23v V-11; rulings 53, P9; DV-086 |
| D-5 | As-is lines, headings, markers and numbers are data files | Parity compares bytes; a literal in code drifts | Literals in code | R18 O-6 (N-24) |
| D-6 | A prompt still over the window is refused by default and sent under `parity` | The brief's criterion "no critic call exceeds the declared window"; at the baseline an overflow ends as MALFORMED anyway, after a paid call | Always send (as-is); shrink the criteria (forbidden by IR-22 and B-1011) | Brief 117 heading 8; B-0922; baseline `lib/critic.py:301-338`. Register row DV-099; row 57 of annex X §X.7; CQ-059 |
| D-7 | The block set of the critic's prompt is a switch, `current` or `as-is` | Boundaries and the data sentence change the prompt that FX-25 compares in full; feature 100 has a row for the proposer's block set only (row 12) | Framing always on with a waiver per fixture: every scenario of FX-25, FX-02 and FX-05 would be waived | R11 R-5; F100-FR-221; N-24. Register row DV-100; row 58 of annex X §X.7; CQ-060 |
| D-8 | The fact block stands after the rules and before all outside text; it is reduced by the rule of IR-22 | Facts of the runtime stand before untrusted text | At the end of the prompt, where the as-is grounding stands | R23 IR-22; R11 T-04; annex X §X.9 |
| D-9 | Boundary token: 64 bits, one per call, handled as the nonce | One call allows one guess | 128 bits | Ruling P16; R11 R-5 |
| D-10 | The hidden files are kept in the control plane with a record written before the move; recovery reads the record | A kill between move and record must not lose a file | Renaming inside the working tree (the critic could read it); copying and deleting (not atomic) | Ruling D1; architecture section 5 |
| D-11 | State is named by the logical names of annex B §B.5: `attempt:<N>:<k>:<n>:withheld-paths`, `attempt:<N>:<k>:<n>:hidden-files`, `gate:<N>:proofs`. The three were missing on 2026-09-29, were reported and are rows of the annex now | F100-FR-038, F100-FR-053 | Working names in the plan: removed on 2026-09-30 | Feature 100 annex B §B.5, §B.20 |
| D-12 | The ignore probe runs through the process primitive of the kernel | The core may not import the process module | Moving the probes to another package | `package-graph.json` of feature 100; LR-1 |
| D-13 | The rejection history belongs to the diagnostician's prompt only | The baseline builds it there; decision 21 keeps history from the critic | Giving it to the critic | Baseline `lib/critic.py:1672-1744`; R27 D1.12 |
| D-14 | Lisa's grounding is aligned to the baseline before `CT-117-1` is written | A characterization test written first would fix Lisa's behaviour without globs | Writing new and extracting nothing: allowed if the alignment costs more than new code; the test stays | R19 C-17; R1; ruling 12 |
| D-16 | No module of the feature imports `node:fs`. Reading goes through a file-reading port, the hiding and the sweep through a file-moving port, records through the atomic write of the kernel. The types are in the core; the implementation on the file system is handed in by the composition root | F100-FR-012 as repaired: a core package does not import the file-system module | Write calls of `node:fs` in `hide/` (the plan of 2026-09-29); a new edge package (not in the package graph, so not invented) | F100-FR-012, F100-FR-234; `package-graph.json`; CQ-185 |
| D-17 | Outside text reaches a sink only through the one ingress of F100-FR-009; the feature calls the redactor nowhere itself | One point of redaction (F100-FR-205) | A call of the redactor in the assembler | Annex A F100-FR-009; annex X §X.4 |
| D-15 | The vocabulary test exempts the as-is heading of the grounding snapshot | The heading holds the word "snapshot" and parity binds it | Renaming the heading with the block set `current` | R29v PU-83; B-0887. Reported as CQ-061 |

## What is `unverified`

| Item | Check that would verify it |
|---|---|
| The read denial of the withheld paths by a harness's sandbox | The capture of feature 131 (R29v open question 1) |
| Every macOS statement: local-time form of the modification time, real paths through links, a move across file systems | A macOS runner passes the tests of this feature |
| The time of a snapshot at full budget | Measured in the build |
