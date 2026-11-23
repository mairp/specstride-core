# Data Model: Gate and verdict (feature 101)

Phase 1 of the plan. Records that feature 100 defines are cited and not repeated. Fields are
given in words; schema files are made in the tasks.

## Entities

| Entity | Logical name | Writer | Defined by |
|---|---|---|---|
| Approval record | `gate:<N>:approved` | Engine | Feature 100 annex B §B.14 (`specstride.approval/1`) |
| Approval key | `feature:<slug>:approval-key` | Runtime | This feature |
| Terminal record | `run:<runId>:terminal` | Engine | Feature 100 annex B §B.15 (`specstride.terminal/1`) |
| Record of a phase attempt | `attempt:<N>:<k>:<n>:record` | Engine | This feature, below |
| Verdict record | `attempt:<N>:<k>:<n>:verdict` | Engine | This feature, below |
| Feedback | `attempt:<N>:<k>:<n>:feedback` | Engine | This feature, below |
| Hint | `attempt:<N>:<k>:<n>:hint` | Engine | This feature, below |
| Acceleration note | `attempt:<N>:<k>:<n>:acceleration` | Engine | This feature, below |
| Tree state around an accelerated phase attempt | `attempt:<N>:<k>:<n>:accelerator-snapshot` | Engine | This feature |
| The accelerator's own note | `attempt:<N>:<k>:<n>:accelerator-note` | Proposer, as a claim | This feature |
| Archived phase evidence | `attempt:<N>:<k>:<n>:evidence` | Engine | Feature 100 annex B §B.5 |
| Result of the verification gate | `attempt:<N>:<k>:<n>:verification` | Engine | Feature 100 annex E §E.4; content: 105 |
| Invocation record of the critic call | `attempt:<N>:<k>:<n>:critic-invocation` | Engine | Feature 100 annex B §B.5 |
| Recovery markers | `phase:<N>:recovery-markers` | Engine | This feature, below |
| Archive at approval | `phase:<N>:approved-archive` | Engine | This feature |
| Counts | `run:<runId>:ledger`, namespace `core` | Engine | Feature 100 annex B §B.13; content: 103 |

## Record of a phase attempt

| Field | Meaning | Type in words |
|---|---|---|
| `schema` | Schema id | Text |
| `attemptId`, `phase`, `ordinal`, `engineStartOrdinal` | Identity | Text, whole numbers |
| `kind` | The kind that the attempt planner gave (feature 100 annex E §E.1; annex X §X.6 row 9) | Member of a closed set |
| `role` | `proposer` or `accelerator` | Text, from the role registry |
| `harness`, `model`, `modelTier` | What ran the passes | Text |
| `planned` | The decision record of the attempt planner, as it returned it | Record, or absent |
| `signature` | The signature of unmet criteria of the feedback that led to this phase attempt | Text, or absent |
| `outcome` | `approved`, `rejected`, `malformed`, `gate-failed`, `config-error`, `no-verdict` | Member of a closed set |
| `verdictId` | The verdict, where one exists | Text, or absent |
| `archived` | Whether the phase attempt was archived, and the label of the archive | Record |

`outcome` is a field of this record only; the verdict stays one of the three members of the
closed set of verdicts. `gate-failed` and `no-verdict` have no verdict.

## Verdict record

| Field | Meaning |
|---|---|
| `schema`, `verdictId`, `attemptId`, `phase`, `ordinal` | Identity |
| `verdict` | APPROVED, REJECTED or MALFORMED |
| `detail` | For MALFORMED: a member of the closed set of details |
| `reason` | The reason line of a verdict that is no approval, at most 120 characters |
| `calls` | One entry per call of the strategy: critic (harness, provider, model, form, proof), session id, hash of the nonce, time, usage, latency, outcome of the call |
| `transcript` | The as-is form: header lines, the prompt in full, the reply or `(empty)` |

Validation: exactly one `verdict`; `detail` present only with MALFORMED; at least one entry in
`calls`; the session id of no call equals a session id of a pass of the phase attempt.

## Feedback, hint, acceleration note

Text records with as-is content. The as-is texts are in `contracts/as-is-literals.md`.

| Record | Parts, in order |
|---|---|
| Feedback of the critic | Heading with the phase and the verdict; for MALFORMED the quoted notice with the detail; the line that says what must be addressed; the reply, or `(no critic output)` |
| Feedback written by the engine | The feedback of a failed verification gate, from its result record (content: 105) |
| Hint | Heading with the phase and the ordinal; the notice of three lines; the reply, or `(empty diagnostician reply)` |
| Record of the call of the diagnostician | Kept in the invocation record of the call: the critic (harness, provider, model), the form of the `completion` level, the proof and its result, the result of the critic-diversity test (a member of the closed set of feature 100, annex X §X.6, row 183) and whether the warning was raised (F101-FR-020) |
| Acceleration note | Heading with the phase and the ordinal; the criteria; the files changed; the accelerator's own notes |

Derived values:

| Value | Rule |
|---|---|
| Signature of unmet criteria | Sorted task ids without repeats, joined as at the baseline; or `text:` and the hash of the feedback without verdict lines |
| Gist | One line by the order of F101-FR-019, at most 160 characters; 100 in the rejection trail of the halt banner |
| Reason | First non-empty line of the reply that is no verdict line, at most 120 characters |

## Accelerator snapshot

The state of the tree around the pass of an accelerated phase attempt (F101-FR-026). Written by
the engine from the fixed-argv calls of the version-control tool through the check runner port;
both halves are empty outside a repository.

| Field | Meaning |
|---|---|
| `schema`, `attemptId`, `phase`, `ordinal` | Identity |
| `before` | The files changed against the last commit, each with its counts of lines added and removed, and the files that are new, sorted; taken before the pass |
| `after` | The same, taken after the pass |
| `changedByPass` | The files whose entry differs between `before` and `after`, sorted; the list that the acceleration note names |

## Archive at approval

What F101-FR-033 sets aside after an approval so that nothing of the recovery cycle reaches a
later phase: the feedback, the hint and the acceleration note that are left of the phase, as they
were. It is a set of copies of text records under `phase:<N>:approved-archive`, one file per
record, and it replaces the set of an earlier approval of the phase. It has no schema of its own.

## Recovery markers

| Field | Meaning |
|---|---|
| `schema`, `phase` | Identity |
| `diagnosed` | The signature for which the diagnostician ran last; written after every call |
| `accelerated` | The signature for which an accelerated phase attempt started last; written before its pass |

Removed at the approval of the phase.

## Approval key

| Field | Meaning |
|---|---|
| `schema`, `keyId`, `createdAt`, `feature` | Identity; the key id is a hash of the key |
| `key` | The key material. Never in an event, a log, an export without signature, or an environment |

## Counts of the phase gate (ledger, namespace `core`)

| Count | Scope | Changes | Reset |
|---|---|---|---|
| Ordinal of the phase attempt | Phase | +1 at every new phase attempt | `--reset-counts`; approval of the phase |
| Reject count | Phase | +1 at every rejection | As above |
| MALFORMED streak | Phase | +1 at MALFORMED; 0 at every other result | As above |
| Kind of the phase attempt before | Phase | Set at every phase attempt | As above |

## State transitions of a phase attempt

```text
planned ──► passes running ──► evidence present ──► verification gate
                                                        │ fails ─────────────► rejected (gate-failed)
                                                        ▼ passes or not required
                                                   critic strategy
         config error, found ◄──────────────────────────┤
         before the call (halt, exit 3)                 │ REJECTED ──────────► rejected
                                                        │ MALFORMED, failure ► rejected (malformed)
                                                        ▼ APPROVED
                                              approval record written and verified
                                                        │ no ────────────────► rejected
                                                        ▼ yes
                                                     approved ──► steps after the approval

rejected ──► MALFORMED limit? ──► diagnostician? ──► oscillation? ──► reject limit? ──► archive ──► next
                 │ halt 1                                 │ halt 2          │ halt 2
```

A missing credential of the critic is a configuration error outside the `parity` profile and a
failure of the call, scored MALFORMED, under it (F101-FR-010, CQ-187).

A phase attempt whose pass loop ended without phase evidence never reaches the phase gate; the
engine maps the result of the pass loop as feature 100 annex E §E.4 states.

## Closed sets of this feature

As in the section "Closed sets" of the spec, which lists the `outcome` of a phase attempt above
as well; it is internal to the record of a phase attempt (row 278 of annex X §X.6).
