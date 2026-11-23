# Research: Front door

Decisions of Phase 0. Sources stay in `docs/ecosystem/`; this file summarizes and links.

| # | Decision | Rationale | Alternatives considered |
|---|---|---|---|
| 1 | Two output modes, chosen by `output.compat`; the profile `parity` selects compatibility output | Decision 16, DV-033; F100-FR-175 | A third "legacy" flag: rejected, F100 fixes exactly two |
| 2 | Default output is built from closed fields only; text is referenced by logical name, size and hash | R11 T-12, T-33; F100-FR-177 | Print text with a warning: rejected, it is an injection route |
| 3 | Byte limits 1,120 and 2,240 from 400 and 800 tokens at 2.8 bytes per token | R17 part 2 | Token counting at run time: rejected, the gate is on bytes |
| 4 | `status` state line comes from the read model (EP-09); sections from the spec, the phase records and the projection | R15v E-3; DV-042 (probe, not lock existence) | Read the event file for the state: rejected, F100-FR-188 gives the read model that job |
| 6 | Presenter, banner and theme are internal calls, not commands (their specification moved to `145-presenter`) | Ruling 26; F100-FR-171 | Keep three hidden commands: rejected |
| 7 | One bundled ESM file with lazy imports; no dependency loaded by a command that does not use it | R17 part 1, F17 | A native helper: not proposed |
| 8 | A value-less flag exits with the baseline's status (127 on the reference shell) | B-0235 is `ported`; local check on GNU bash 5.2.37 gave 127 | Exit 3: would diverge without a register row |
| 9 | Follow modes are exempt from the cap after the first replay | An unbounded follow cannot have a byte cap | Cap the whole session: makes `watch` useless |
| 10 | The bundler of the published package is `rollup`, a development dependency of this feature only. Licence: MIT. Native part: none (pure JavaScript). Version and licence `unverified` until the build pins them. Added by the repairs after the cross-feature review (W-119-01, F119-FR-056) | Principle VI: the install succeeds with no compiler; a tool of the build is not a component (CQ-186) and never enters the manifest of the packed package | `esbuild`: rejected here, it ships a platform binary (a native part), which the plain-install test would have to explain away; `tsc` alone: rejected, it does not emit one bundled ESM file |

Reports used: R17 (budgets, startup check), R11 (T-12, T-33, LR-9), R13 (viewer boundary: `watch` is a Wave 1 card, the follower is Wave 2), R15v (E-3, O-3), R19 (D-24), R1 (Lisa routing rules), R18 (Appendix A and B).
