# Data Model: Harness seam (feature 109)

Phase 1 of `plan.md`. Schemas that feature 100 owns are cited and not repeated. Field names that
this feature adds are proposals until the orchestrator takes them into feature 100; the fields of
the verification result are no proposal, they are those of the owner of the schema.

## Entities

| Entity | Identity | Schema | Writer | Lifetime |
|---|---|---|---|---|
| Registry entry | `id`, unique in the registry | Below | The registry at process start | The process; what a run resolved is `run:<runId>:registry` (feature 100, annex C §C.6; writer: CLI at launch, feature 124) |
| Harness descriptor | `id` and `origin` | Feature 100, annex C §C.2, `descriptorVersion: 1` | The consumer (`user:harness:<id>`), or the product (`package:harness:<id>`, annex B §B.5) | Until changed; its hash is recorded per run |
| Overlay declaration | The id of the entry | `isolation.configHome` of the descriptor: `vars`, `seeds` | As the descriptor | As the descriptor |
| Overlay tree | The root path; the marker | `specstride-overlay/v1` (feature 100, annex C §C.16) with the fields of `contracts/overlay-marker.schema.json` | The harness layer | `pass`: one pass. `attempt`: one invocation of the pass loop. `critic`: one call |
| Call environment | Per call | A map of names to values, built from the allow-list | The harness layer | One call |
| Proof of the critic's form | Per critic-class call | Below | The seam, into the invocation record of the call through the engine | With the invocation record |
| Verification result | The id of the harness | `specstride.harness-verify/1` at `user:harness-verify:<id>` (feature 100, annex B §B.5 and §B.20); fields below | The CLI on request, through the command of this feature | Until the version or the hash of the descriptor changes |

## Registry entry

| Field | Meaning | Type in words | Rule |
|---|---|---|---|
| `id` | Id of the harness | Lower-case letters, digits, hyphens | Unique; F109-FR-001 |
| `origin` | `adapter`, `bundled`, `user`, `detected` | Member of a closed set | Set by the loader |
| `levels` | `proposer`, `completion` or both | List of members of a closed set | Each level has its operations, else registration fails; F109-FR-002 |
| `missing` | Per role: the capability P1 to P6 or C1 to C6 that is missing | Map, may be empty | F109-FR-002 |
| `roles` | Per role: served or not; the qualifier form `none`, `optional`, `required`; the label of the qualifier | Map | F109-FR-006 |
| `stream` | Stream format, or null for raw text | Member of an open set, or null | F109-FR-007 |
| `overlay` | The overlay declaration, or null | Record, or null | F109-FR-030 |
| `overlayDeclarable` | False where the harness adapter keeps an overlay of its own | Truth value | Answered by the harness adapter; F109-FR-030 |
| `transports` | Each with auth tier, terms row and availability | List of records | F109-FR-011 |
| `containmentCeiling` | C0 to C3, with provenance, `unverified` where no run has shown it | Record | F109-FR-026 |
| `capabilities` | The capabilities of annex C §C.1, each with provenance, or null | Map | F109-FR-004 |
| `executable` | Resolved absolute path and version, for kind `cli` | Record, or null | F109-FR-020 |
| `versionRange`, `verifiedOn` | Only on a tested harness adapter | Text, date | F109-FR-041 |
| `descriptorHash` | Hash of the descriptor, by the canonical hasher | Text | Feature 100, annex X §X.5 |
| `replaced` | Entries of the same id that lost, with the reason | List of records | F109-FR-014 |

Order: the order of registration. It is the order of every listing.

## Overlay marker

The fields of feature 100, annex C §C.16, which holds the three fields of the owner and of the
time of creation for the marker (CQ-064). The scope word of a marker is a member of row 129 of
annex X §X.6.

| Field | Meaning | As-is name | Required |
|---|---|---|---|
| `contract` | `specstride-overlay/v1` | `contract` | Yes |
| `key` | Id of the entry | `backend` | Yes |
| `scope` | `pass`, `attempt` or `critic` | `scope` | Yes |
| `vars` | The overlaid variables | `vars` | Yes |
| `ownerPid` | Process id of the owner | `owner_pid` | Yes |
| `ownerStart` | Start time of the owner, or null | `owner_start` | Yes |
| `createdAt` | Time of creation | `created_at` | Yes |

The oracle compares the marker through the layout table (logical name `overlay:<id>:tree`) with
the process id, the start time and the creation time normalized (N-04, N-07).

## Environment record of an overlay

An ordered list of records of two kinds: `unset <name>` and `set <name> <value>`. Order: every
`unset`; one `set` per declared variable; the global git configuration; the git identity.

## Proof of the critic's form

| Field | Meaning | Type in words |
|---|---|---|
| `form` | `tool-less` or `read-only-tools` | Member of a closed set |
| `proof` | `initial-record`, `pinned-configuration` or `read-only-sandbox` | Member of a closed set |
| `result` | Proven or refused | Truth value |
| `weaker` | True for `pinned-configuration` | Truth value |
| `pin`, `flagSet` | For `pinned-configuration`: the exact version pin and the flag set of the call (F109-FR-038), or null | Text and list of text, or null |
| `toolCount` | Number of tools in the initial record, or null | Whole number, or null |
| `sessionMatches` | Whether the session id of the initial record is the minted one, or null | Truth value, or null |
| `sandboxMode`, `network` | For the second form | Text |
| `withheldConfirmed` | For the second form: the field `confirmed` of the withheld paths (annex C §C.4) | Truth value, or null |
| `refusedActs` | For the second form: acts of writing or of reaching the network that were refused | List of records |

No field holds a session id in clear beyond what the invocation record already holds, a secret or
reply content (F100-FR-052).

## Verification result

Schema id `specstride.harness-verify/1`, logical name `user:harness-verify:<id>`. Feature 100,
annex B §B.20 names the owner of the schema; this feature is the writer (annex B §B.5: written by
the CLI on request) and takes the field names of the owner. It writes no field under another
name. The common rules of annex B §B.4 hold.

| Field | Meaning | Name before the repair of 2026-09-30 |
|---|---|---|
| `schema` | The constant `specstride.harness-verify/1` | `schema` |
| `harness` | Id of the harness | `id` |
| `version` | Version of the harness at the verification, or null where the harness states none | `harnessVersion` |
| `descriptorHash` | Hash of the descriptor at the verification, by the canonical hasher | `descriptorHash` |
| `at` | Date of the run | `date` |
| `outcome` | `passed` or `failed` (annex X §X.6, row 131); an unknown value is read as `failed` | `result` |
| `cases` | Per case of the suite: id and outcome | `cases` |
| `budget` | The stated budget and what was used (the unit is CQ-063) | `budget` |

## State transitions

Overlay tree:

```text
(none) --create directory--> made --marker, directories, seeds, record--> populated
populated --pass or call or invocation ends--> removed
made or populated --populate fails--> removed (the pass fails, the harness is not started)
populated --owner dies--> stale --sweep at the next start--> removed
```

Registry entry (the states of a harness are feature 124's; row 34 of annex X §X.6): this feature
sets `origin` and the capability levels only.

Critic-class call:

```text
minted session --call--> initial record or call record --proof--> proven --reply read--> reported
                                                       --proof--> refused: critic_not_toolless, reply not read
```

## Validation rules

| Rule | Requirement |
|---|---|
| A descriptor validates against the schema of annex C §C.2; unknown top-level key, placeholder, version, shell text refuse it | F109-FR-014 |
| A descriptor from project configuration is ignored | F109-FR-015 |
| An overlay declaration follows the rules of `contracts/overlay-rules.json` | F109-FR-030 |
| An overlay scope is unset, empty, `pass` or `attempt` | F109-FR-031 |
| An executable is absolute, outside the workspace, in no directory that everyone may write | F109-FR-020 |
| An endpoint is encrypted or loopback; a secret goes to its bound host only | F109-FR-018 |
| Auth tier 3 is no valid value | F109-FR-013 |
