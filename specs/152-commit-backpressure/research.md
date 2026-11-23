# Research: 152-commit-backpressure

## Learnings

These are stage-2 notes on where things really live. They are not status reports.

- The closed set of stop reasons is **F100-FR-148** (annex E §E.3). F100-FR-031 is the rule that
  layers add no exit code or stop reason. Older drafts mixed the two up.
- Annex E §E.2 "Blocked reasons" is a closed set "by Design" (annex X §X.6 row 4). Each blocked
  reason maps to an *existing* stop reason (for example `source-changed` → `critic_config`, exit
  3). That makes it cheaper than adding a stop reason, which is closed by owner decision (row 3).
- Feature 123's relaunch table 1 row O-33 (`blocked` → refuse) already refuses to relaunch any
  blocked-on-human run. No change to 123 is needed.
- The post-approval order (F101-FR-033) ticks the tasks and lets learning observe **before** the
  commit. A blocked commit therefore leaves ticked tasks and a learned approval behind unless the
  plan reorders or undoes those steps (F152-FR-004).
- A scan hit has `file`, `line` and an optional `pattern` (`packages/kernel/src/redactor/scan.ts`).
  A hit on a registered secret has no pattern name.
- The divergence register (DV-nnn) and `docs/ecosystem/` are not in this repository. The next free
  numbers seen here are DV-121, §X.7 row 134 and §X.6 row 286.
- This repository has no `.specify/`. The templates are read from
  `/root/specstride-dsh/.specify/templates/`.

## Decisions (stage 3)

### D1 — Where the commit gate runs: in front of the approval record

- **Decision**: on an APPROVED verdict, with the switch on, `commitGate` runs over the would-be
  commit (the changed paths, plus the task list as `tickText` would leave it) **before**
  `boundPath` and `writeApprovalRecord` (`run-feature.ts:2712-2755`). A block returns
  `commit-blocked`, and no approval record ever exists for the attempt.
- **Rationale**: F152-FR-001 and T-a hold by construction. The steps after an approval
  (F101-FR-033) never run for a blocked attempt, so there is nothing to undo: no tick, no
  set-aside, no learning observation (F152-FR-004).
- **Alternatives rejected**:
  - (a) keep the scan at step 6 and void afterwards. Every block would then need the void marker,
    an untick and a learning retraction, and F101-FR-031 would be touched on the hot path.
  - (b) scan before the critic call. That wastes a scan on every rejected attempt and judges a
    tree the critic has not approved. A block is a deterministic fact about an *approved* tree.

### D2 — Model the block as a fourth kind of rejection, like `gate-failed`

- **Decision**: `ATTEMPT_OUTCOMES` and `KINDS_OF_A_REJECTION` gain `commit-blocked`. Its counts
  follow `gate-failed`: the reject count rises, and the MALFORMED streak goes to 0.
- **Rationale**: the order after a rejection already has a deterministic, critic-less feedback
  path (`feedbackOfTheVerificationGate`, `FEEDBACK_OF_THE_VERIFICATION_GATE_IS_FEEDBACK_LIKE_ANY_OTHER`).
  Reusing it adds no loop (F152-FR-005).
- **Alternative rejected**: reusing `gate-failed` itself. Events and the halt step would then not
  be able to tell a failed verification gate from a blocked commit, and F152-FR-006 needs the
  difference.

### D3 — Next-attempt variant over the in-pass micro-layer variant

- **Decision**: the block re-enters as the next phase attempt. The micro layer is not touched.
- **Rationale**: F100-FR-031 forbids the layer any count, exit code or stop reason, so it could
  never halt on a repeated block. The cost per retry is one fresh pass plus one critic call,
  bounded by the reject limit (3).
- **Alternative rejected**: an in-pass repair block. It is cheaper per retry, but the gate only
  runs after APPROVED, so the layer could at most pre-warn. That remains a later option of
  feature 115 (spec, out of scope).

### D4 — The halt decision as a table

- **Decision**: the kernel table `commit-gate-halt` has one input, `sameSignature` (the
  caller computes it: the signature of this block equals the signature of the block record of
  ordinal k−1, data-model E6), and two rows:
  - `CGH-1`: `sameSignature` → halt, `commit-gate`;
  - `CGH-2`: otherwise → `go`.

  The table runs inside `afterARejection` as a new step before the existing reject-limit step,
  and only for `commit-blocked`. On `go`, the reject-limit step decides as for any rejection.
- **Rationale**: Principle XIII asks for pure tables recorded with their rule id. The step runs
  before the reject-limit step, so a repeated block on the last allowed attempt halts as "needs
  a human" rather than as "rejects exceeded". The reject limit stays decided in one place only:
  an earlier draft repeated it as a row of this table, which gave two sources of truth.


### D5 — Quoting of repository values

- **Decision**: paths are JSON-string-escaped, control characters removed, capped at 160
  characters, and placed inside a fenced data region (data-model E3). A path that the redactor
  would change is shown as `[REDACTED-PATH]`. Project rule reasons are quoted the same way.
- **Rationale**: Principle III and F152-FR-011. The JSON escaping makes the data region
  unambiguous whatever the bytes of the name are.

### D6 — The rule data as a watched, pinned source

- **Decision**: the hash of (the engine rules, the project rules) goes into the launch contract's
  source hashes and the run record. It is watched at launch, at resume and at every pass start
  (F103-FR-021), and a change halts `source-changed`.
- **Rationale**: the mechanism already exists for spec, plan and tasks, so a new halt would
  duplicate it (CQ-152-06 A).

### D7 — The pre-tick copy for the void paths

- **Decision**: with the switch on, the pre-tick bytes of the task list are saved before step 4,
  and every void restores them.
- **Rationale**: the tick port has no untick, and F101-FR-032 would otherwise refuse the next
  start of a voided, ticked phase.
- **Alternative rejected**: teaching F101-FR-032 to accept a voided phase. The phase would
  then keep ticked tasks for work that is not approved, which breaks F152-FR-004.

### D8 — The scan reads an overlay for the ticked task list

- **Decision**: `scanCommitFiles` gains an optional `{path → text}` overlay.
- **Rationale**: the pre-scan must read exactly the bytes step 6 will commit, without writing the
  tick first.
- **Alternative rejected**: leaving the task list out of the pre-scan. The step-6 scan could
  then block on it, which would put the void path back on the normal path.

### D9 — No new ledger counter: the block facts are read from the block records

- **Decision**: the signature of the previous block and the number of blocks of a phase are
  read from the block records (data-model E6). The ledger gains no counter. A reset of the counts
  moves `commit-gate/` aside.
- **Rationale**: the ledger's `counters` are a record of whole numbers (`ledger-record.schema.json`),
  so a hex signature cannot be one. `CORE_COUNTERS` is a set of feature 100, and the reader
  `coreCountersFromLedger` reads only its members, so a counter added only in `limits.ts` would
  silently not survive a resume. The block records are already durable and atomic (Principle I).
- **Alternative rejected**: a 7th member of `CORE_COUNTERS` plus a signature in the record's
  `data`. That edits a set of feature 100 and the ledger schema for a fact the control plane
  already holds.

### D10 — The nonce of the corrective block is stored, not derived

- **Decision**: the nonce is drawn once with `newNonce()` (random, `gate/nonce.ts`) when the
  block is found, and stored in the block record (E1). Every rendering reads it from there.
- **Rationale**: `gate/nonce.ts` has no derived nonce, and a derived nonce would be predictable
  to the proposer, which defeats a data fence. Storing it makes the block byte-stable across a
  resume (F152-SC-006) without weakening it.

### D11 — Two counts of blocks at the end of the run

- **Decision**: the digest's `commits_blocked` counts every block. The end-of-run safety net
  (`run-feature.ts:3116`) reads a second count, `commitsLeftUncommitted`. With the switch off it
  rises with every block, so it equals `commits_blocked` and the as-is exit is byte-identical.
  With the switch on it rises only when a block leaves work uncommitted (a void that halts).
- **Rationale**: otherwise a block that the retry fixed would still turn exit 0 into exit 1,
  which contradicts F152-SC-002 and F152-FR-022.
