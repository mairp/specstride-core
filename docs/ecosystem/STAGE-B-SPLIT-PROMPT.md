# STAGE-B-SPLIT-PROMPT — how a feature is split

Written by the orchestrator on 2026-09-29. Sent to the agent that specified the feature. `{OLD}` is the
directory of the feature that is split, `{NEW}` the directory of the second part, `{GROUP}` what leaves.

| Split | `{OLD}` | `{NEW}` | What leaves |
|---|---|---|---|
| 1 | `115-micro-loop-layer` | `116-check-integrity-and-unit-evidence` | Group G-B |
| 2 | `108-reverse` | `140-reverse-inventory-and-lint` | Group G-B |
| 3 | `142-parallel-units` | `143-parallel-engine-services` | Group G-B |
| 4 | `111-event-schema-and-projection` | `144-compatibility-projection` | Group G5 |
| 5 | `119-front-door-and-presenter` | `145-presenter` | Group G3 |
| 6 | `124-harness-discovery-and-roles` | `146-harness-discovery` | Groups G1, G2 |
| 7 | `110-config-and-terms` | `147-terms-gate` | Group G4 |
| 8 | `105-verification` | `148-check-runner` | The 18 requirements of the check runner |
| 9 | `101-gate-and-verdict` | `149-attempt-planner-and-seams` | Group G4 |

---

Your feature `{OLD}` is split, as you proposed in your report. The second part is `specs/{NEW}`. What
leaves: {GROUP}, exactly the requirements, success criteria, origins and tests you listed in your split
proposal.

Do this, in order.

1. **Create `specs/{NEW}`** with its own `speckit-specify` run, `SPECIFY_FEATURE_DIRECTORY=specs/{NEW}`.
   Its content is the leaving group. Then run `speckit-clarify`, `speckit-plan`, `speckit-tasks` and
   `speckit-analyze` for it, and save `specs/{NEW}/analyze-report.md`.
2. **Ids.** A requirement that moves gets a new id with the number of the new feature, starting at
   `F<new>-FR-001` and `F<new>-SC-001`, in the order of the old ids. Test names follow:
   `PT-<new>-…`, `CT-<new>-<n>`. Write the table of old id to new id, for requirements, success
   criteria and tests, into `specs/{NEW}/spec.md` under a heading `## Ids before the split`, and the
   same table into `specs/{OLD}/spec.md` under `## Requirements moved to {NEW}`.
3. **Take the leaving requirements out of `specs/{OLD}`**: spec, plan, data model, contracts, tasks,
   quickstart. The old ids are never reused and the remaining ids keep their numbers, so the sequence
   of `{OLD}` has a gap, which the table of step 2 explains. Then run `speckit-analyze` again for
   `{OLD}` and replace its `analyze-report.md`.
4. **No citation between the two parts.** Each part cites the other only through a contract of
   feature 100. Where a requirement of one part named a requirement of the other, it names the
   section of the annex of feature 100 that holds the contract. If feature 100 holds no such
   contract, say so in your report; do not cite the sibling.
5. **Everything the rules ask of a feature holds for both parts**: `## Constraints`,
   `## Extension points`, `## Contracts of feature 100 used`, closed sets, the `parity` value of every
   option, "As-is behaviour not carried", `## Clarifications`. An extension point, a closed set or a
   profile row belongs to the part that holds its requirements.
6. **Queue and register ids.** Your files now hold final ids (`CQ-0nn`, `DV-0nn`) where you had
   written `CQ-pending-<n>` and `DV-new-<n>`; the orchestrator replaced them. Keep them. The register
   runs to DV-113 and the queue to CQ-175. A new question or a new row is again written
   `CQ-pending-<n>` or `DV-new-<n>`, numbered from 1.
7. **Traceability.** You do not edit the traceability files. Until the orchestrator has moved the
   rows, `python3 docs/ecosystem/check-traceability.py` does not know `{NEW}` and reports the moved
   origins as missing from `{OLD}`. That is expected. Check instead, by your own script, that every
   as-is id that `traceability-frs.tsv` and `traceability-items.tsv` assign to `{OLD}` with a kept
   disposition is in the `origin:` of a requirement and in the `proves:` of a test task of exactly
   one of the two parts.

Rules as before (`docs/ecosystem/STAGE-B-RULES.md`): you write only inside `specs/{OLD}/` and
`specs/{NEW}/`; no commits; no subagents; temporary files in your own scratch directory; write large
files in several smaller writes.

Report, as plain text and short:

1. The number of requirements and success criteria of each part.
2. The as-is ids that move to `{NEW}`, as three lists: requirements and success criteria
   (`028 FR-027`), whole clusters (`C-124`), and single behaviour items of a cluster that is divided
   (`B-1120`), each with the test names and fixture families of the new feature. The orchestrator
   moves exactly these rows in the traceability files.
3. Extension points, closed sets (row numbers of feature 100 annex X §X.6) and profile rows (annex X
   §X.7) that now belong to `{NEW}`.
4. Citations between the two parts that feature 100 cannot carry.
5. What did not pass analyze, for each part.
6. New questions and new register rows.
