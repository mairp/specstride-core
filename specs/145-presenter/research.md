# Research: Presenter

| # | Decision | Rationale | Alternatives considered |
|---|---|---|---|
| 1 | The presenter reads the compatibility projection in compatibility output and the primary stream in default output | DV-007, N-12; F100-FR-105 | One reader of the primary stream with a mapping table at print time: kept as an option if the projection file is absent |
| 2 | Presenter, banner and theme are internal calls, not commands; as-is exit codes are result-record fields | Ruling 26; F100-FR-171; LR-6 | Three hidden commands: rejected |
| 3 | Escape sequences, glyphs and colour roles are written from tables, with no terminal library | Byte-exact parity with the baseline on FX-40; a library would add bytes and startup time | A terminal library: rejected |
| 4 | Rendering on a pseudo-terminal is proven on FX-40 (feature 141); FX-28 keeps what a terminal-less capture reaches | Feature 141 §O.2 | Only FX-28: cannot reach escape sequences |
| 5 | The live view is a reader that a run never waits for; it is ended 0.6 seconds after the engine exits | B-0265; Principle V | Wait for the presenter: rejected |
| 6 | Wave 1 keeps the card of the baseline; the terminal follower is Wave 2 | R13; brief 119 | Build the follower now: out of scope |

Reports used: R13 (viewer boundary), R17 (startup), R18 (Appendix A and B), R1 (Lisa presenter, an older version, starting point only).
