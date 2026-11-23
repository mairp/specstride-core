# Data Model: Specstride (umbrella, feature 100)

Phase 1 of the plan. The fields of every record are in the annexes and, in machine-readable form,
in `contracts/schemas/`. This file gives what a field list does not: the entities, how they relate,
who writes each, the rules of validation, and the transitions of state. It repeats no field list.

## Entities and their relations

```text
Workspace (workspaceId)
 ├─ workspace record, lock, inbox                      one control plane per workspace
 ├─ Launch (launchId)                                  one start of the runtime root
 │    └─ launch record, supervision record, runtime log
 ├─ Pipeline (pipelineId)                              one launch contract
 │    └─ launch contract, launch bundle, stage state, four compared files
 └─ Feature (slug)
      ├─ approval record per phase  (gate:<N>:approved)        survives runs
      ├─ learning: decisions, events                           own writer domain
      └─ Run (runId)                                   the logical run; survives resume and relaunch
           ├─ run record, terminal record, pause record, lease  one file per writer
           ├─ run snapshot, resolved registry and role plan, parallel plan
           ├─ event stream, ledger, process registry
           ├─ Engine start (engineStartId, ordinal k)
           └─ Phase (N)
                ├─ check manifest, protected set
                └─ Phase attempt (attemptId; ordinal n)
                     ├─ evidence set aside, verification result, verdict, fact block, feedback
                     ├─ Pass (passId)       prompt, stream, invocation, usage, result
                     ├─ Unit of work (unitId)   checkpoint, check results
                     └─ Detached job (jobId)    yield artifact, record, log
```

| Entity | Identifier | Records (schema file) | Annex |
|---|---|---|---|
| Workspace | `workspaceId` | `workspace-record` | B §B.6 |
| Launch | `launchId` | `launch-record`, `supervision-record` | B §B.7, §B.16 |
| Owner of a lock | — | `owner-record`, inside `lease` | B §B.8, §B.9 |
| Run | `runId` | `run-record`, `terminal-record`, `pause-record`, `run-snapshot`, `resolved-registry`, `parallel-plan` | E §E.2; B §B.12, §B.15, §B.17; C §C.6; D §D.3 |
| Process | `procId` | `process-registry` | B §B.10 |
| Request from outside the runtime tree | — | `inbox-request` | B §B.11 |
| Ledger record | `seq` | `ledger-record` | B §B.13 |
| Approval | phase, `verdictId` | `approval-record` | B §B.14 |
| Tripwire | — | `tripwire-record` | B §B.18 |
| Harness | harness id | `harness-descriptor`, `overlay`, `stream-dialect-row`, `withheld-paths` | C §C.2 to §C.5, §C.16 |
| Specification | feature slug | `canonical-spec-model` | C §C.7 |
| Phase | phase number | `check-manifest` | D §D.8 |
| Phase attempt | `attemptId` | `fact-block` | D §D.7 |
| Detached job | `jobId` | `yield-artifact` | D §D.6 |
| Pipeline | `pipelineId` | `launch-contract` | G §G.8 |
| Event | `seq` | `event-envelope` | X §X.1 |
| Configuration | — | `config-envelope` | X §X.2 |
| Rule table | table id, version | `rule-table` | X §X.3 |
| Redaction pattern set | version | `redaction-pattern-set` | X §X.4 |
| Doctor run | — | `doctor-findings` | G §G.7 |

## Writers

One writing process per state file (F100-FR-051). The table of annex B §B.5 names the writer
of every logical name; `contracts/data/layout.json` holds it as data.

| Writer | What it writes |
|---|---|
| CLI | Launch record, inbox requests, supervision record, run snapshot at launch, resolved registry, launch contract, launch bundle |
| Runtime root (the engine in start mode `standalone`) | Workspace record, run record, lease, advisory marker, process registry (its own file), stage state; a synthesized terminal record after a crash of the engine |
| Engine | Terminal record, pause record, event stream while it lives, ledger, approval records, everything under a phase, process registry (its own file), tripwire |
| Learning | Its decisions and its events, under its own lock |
| Proposer | Phase evidence, outbox, notebook: claims |
| Consumer | User configuration, project configuration |

## Rules of validation

| Rule | Requirement |
|---|---|
| Every record carries `schema` with its major | F100-FR-048 |
| A different major refuses the record; an unknown field is ignored | F100-FR-049 |
| A closed schema (harness descriptor, configuration file, launch contract) refuses an unknown top-level key and ignores keys under `x-` | F100-FR-084, F100-FR-203, F100-FR-190 |
| A value outside a closed set is handled by the rule of its row | F100-FR-208 |
| No record holds a secret, a nonce before its call returned, or content | F100-FR-052 |
| A file is written to a temporary name and renamed | F100-FR-036 |
| Real paths stay inside their root; no link inside the control plane | F100-FR-043 |
| The ledger is chained and signed; the approval record is signed with another key | F100-FR-068, F100-FR-070 |
| The check manifest and the parallel plan are verified against their hash before use | F100-FR-137, F100-FR-126 |

## State transitions

### Run

The machine is annex E §E.2 and `contracts/data/run-state-machine.json`: ten written states, three
derived conditions, eighteen transitions, each with the process that owns it.

```text
             T1            T2            T4
   (none) ───────▶ created ───▶ starting ───▶ running ◀──────────────┐
                     │ T3          │ T5          │  ▲ T7              │ T11
                     ▼             ▼             │  │                 │
             blocked-on-human    failed          │ paused-quota    relaunching
                     ▲                           │  T6 │ T8           ▲   │ T12
                     │ T8, T9                    │     ▼              │   ▼
                     └───────────────────────────┤  blocked-on-human  │ failed
                                                 ├── T10 ─────────────┘
                                                 ├── T13 ─▶ stopping ── T14 ─▶ stopped
                                                 ├── T15 ─▶ finished
                                                 └── T16 ─▶ failed
   blocked-on-human, stopped, failed, dead ── T17 (resume) ─▶ created
   any live state ── T18 (owner gone; derived, never written) ─▶ dead
```

### Launch contract

`draft` → `validated` with a proof of promotion (only by validation) → `draft` again when a later
validation fails. A validated launch contract whose sources changed is stale (pipeline code 23).

### Approval of a phase

Not approved → approved, by one signed record after a verdict APPROVED that followed the
verification gate. A record that fails verification on `resume` counts as not approved.

### Process in the registry

Started → ended. An `owned` process is ended by a stop; an `adoptable` one survives and is adopted
by the next engine start (F100-FR-064).

### Quota pause

The pause record exists exactly while the state is `paused-quota` (F100-FR-073).

### Tripwire

Absent → raised by the runtime on a breach of the integrity of the phase gate → cleared by the
operator (F100-FR-074).

## Data that is not a record

| Data | File | Annex |
|---|---|---|
| Closed sets, 285 rows | `contracts/data/closed-sets.json` | X §X.6 |
| The `parity` profile, 133 rows | `contracts/data/parity-profile.json` | X §X.7 |
| Normalization rules, alias table, component names, maps | `contracts/data/normalization.json` | X §X.8 |
| Layout, new side with physical paths, 127 names | `contracts/data/layout.json` | B §B.5 |
| Layout, old side, 199 rows | `contracts/data/layout-old-side.json` | X §X.8 |
| Exit codes; stop reasons | `contracts/data/exit-codes.json`; `contracts/data/stop-reasons.json` | E §E.3, §E.4; F §F.8; G §G.4 |
| Package graph | `contracts/data/package-graph.json` | A §A.2, §A.3 |
| Threat model | `contracts/data/threat-model.json` | X §X.9 |

## Volume

A run of days writes an event stream of the order of 10^5 to 10^6 lines and a ledger of the order
of 10^3 records. Readers fold the stream with a cursor held by the caller (F100-FR-188); no
reader loads a stream whole. Low confidence: from the reference run of the research, not measured
on the product.
