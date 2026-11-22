# R18 partial work (preserved from scratch)

R18 (behaviour inventory and parity oracle) was cut off by the session limit on 2026-09-29 before
it wrote its report. These files were copied from `/tmp/specstride-research/R18/` so that a restart
does not lose them. They are inputs for the relaunched R18, not a finished report.

| File | Content |
|---|---|
| `raw/*.tsv` | Inventory rows per area, 2,779 lines in total: Specstride critic, front door, orchestrator, proposer, reverse and spec grammar, stream and telemetry; mixture-of-loops runtime and supervisor |
| `appendix.md`, `clusters.md` | The merged appendix and the clustering, as far as they got |
| `check_rows.py`, `merge.py`, `rowlib.py`, `mol_*_rows.py` | The row checker, the merger and the row generators |
| `AGENT-BRIEF.md` | The brief R18 gave its helpers |

Still missing when R18 stopped: the mixture-of-loops onboarding and skill rows, the final `B-001…`
numbering, and the whole of part 2 (the oracle design).

The reverse and spec-grammar helper reported 460 rows, of which 362 have no covering as-is FR.
