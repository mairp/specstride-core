# Data model: Check integrity and unit evidence (feature 116)

Phase 1 of the plan. Records whose schema feature 100 owns are named with their annex and are not
repeated. This feature owns the records `specstride.protected-set/1` and
`specstride.check-result/1` (feature 100, annex B §B.20); their fields are listed in `spec.md`,
"Records owned by this feature" (F116-FR-023), and repeated here.

## Entities

| Entity | Logical name | Owner of the schema | Writer |
|---|---|---|---|
| Check manifest | `phase:<N>:manifest` | 100, annex D §D.8 | Engine at launch |
| Protected set | `phase:<N>:protected-set` | 116, `contracts/schemas/protected-set.schema.json` | Engine |
| Check result | `unit:<unitId>:check:<i>` | 116, `contracts/schemas/check-result.schema.json` | Engine |
| Fact block | `attempt:<N>:<k>:<n>:fact-block` | 100, annex D §D.7 | Engine |
| Toolchain profile | `user:toolchain:<id>`; shipped profiles in the package | 116, `contracts/schemas/toolchain-profile.schema.json` | Consumer; the product |
| Approval record | `gate:<N>:approved` | 100, annex B §B.14 | Engine; read here for the approved tree |
| Ledger | `run:<runId>:ledger` | 100, annex B §B.13 | Engine; read here |
| Run record, field `containment` | `run:<runId>:record` | 100, annex E §E.2 | Runtime root |

## Protected set

| Field | Meaning |
|---|---|
| `schema` | `specstride.protected-set/1` |
| `phase` | Phase number |
| `profiles` | The toolchain profiles used, each with `id` and `version`; empty when none |
| `basic` | Whether the basic protection applied |
| `classA.patterns` | Path patterns, evaluated at every comparison |
| `classA.ignoredListings` | Ignored paths a command executes from, each with `path`, `listingHash` (over name, kind, size, mode, modification time and time of the last change of status of every entry) and `contentHashed` (pinned executables and files matched by a class A pattern, each with `path` and `hash`) |
| `classB.files` | Test files at phase entry, with content hashes |
| `authorised` | Paths that the task text at launch names, per task id |
| `atLaunch`, `atPhaseEntry` | Each with `set`, the fingerprint of the set, and `tree`, the tree fingerprint |
| `exclusions` | What the tree fingerprint excludes |
| `effectiveConfig` | Hash of the effective configuration of the toolchain at phase entry, or null |

## Check result

| Field | Meaning |
|---|---|
| `schema` | `specstride.check-result/1` |
| `unitId`, `ordinal` | The unit and the ordinal of the check |
| `treeBefore`, `treeAfter`, `protectedBefore`, `protectedAfter` | Fingerprints |
| `commands[]` | Per command of the manifest, in manifest order: `id`, `exit` (whole number or null), `conditions` (each of `tainted`, `cached`, `flaky`, `interrupted`, `unchecked` in a field of its own: false, or an object with `reason`), `observed` (both results of a flaky command), `durationMs`, `outputRef` (`name`, `hash`, `bytes`) |
| `excluded[]` | Commands excluded, each with `id` and `reason` |

This is the stored record. The check runner returns a value whose fields have its own spelling;
the engine writes `id` from `commandId` and `exit` from `exitCode`. Output is kept by reference
(`outputRef`) and is not in the record.

Freshness is not stored. It is derived when the fact block is built: `current` when `treeAfter`
equals the tree at the phase gate, `superseded` otherwise.

## Toolchain profile

A profile of the consumer is the value of the key `toolchains.<id>` of user configuration
(F116-FR-014) and is stored under `user:toolchain:<id>`.

| Field | Meaning | Required |
|---|---|---|
| `schema` | `specstride.toolchain/1` | Yes |
| `id`, `version` | Id of the toolchain and version of the profile | Yes |
| `detect` | File names and patterns whose presence detects the toolchain | Yes |
| `classA` | Patterns of files by which a check is defined | Yes |
| `testFiles` | Patterns of test files | No |
| `caches` | Cache locations, each with the environment that switches it off | No |
| `userConfig` | User-level configuration files of the toolchain | No |
| `suppressionMarkers` | Patterns of suppression markers | No |
| `executables` | Executables to pin | No |
| `effectiveConfig` | One fixed argument list of a pinned executable, or null | No |
| `workerSeeds`, `workerEnv` | Seed paths of worker trees; environment per worker. Used by the layer of parallel units | No |

## From a check to a row of the fact block

```text
 fingerprint before ──▶ check (check runner) ──▶ fingerprint after
        │                       │                       │
        └───────────────┬───────┴───────────────────────┘
                        ▼
              check result: exit per command, conditions in fields of their own
                        │           tainted  = set or tree differs (changed-during-check), class A/B differs
                        │                      from phase entry (protected-set-changed), or a pin fails (pin-mismatch)
                        │           cached   = the tool reports a replay
                        ▼
              at the phase gate: freshness (current | superseded)
                        ▼
              fact block row: unit id, command id, exit result, conditions, freshness
```

## Validation rules

| Rule | Requirement |
|---|---|
| A result is a pass only with equal fingerprints before and after, apart from declared writes | F116-FR-005 |
| A condition never replaces the exit result | F116-FR-008 |
| A path is authorised only when a task of the phase names it in the text at launch | F116-FR-010 |
| A profile from project configuration is ignored | F116-FR-014 |
| An ignored path of class A is covered by its listing; pinned executables and files matched by a class A pattern are hashed by content | F116-FR-003 |
| An integrity event of this feature is one event `integrity.noted` with `kind` and `detail` | F116-FR-022 |
| Both records carry their schema id and the fields of the specification | F116-FR-023 |
| The fact block holds none of the excluded fields | F116-FR-019 |
| The fact block is a pure function of the final state | F116-FR-020 |
| A writer never writes a value outside a closed set | `spec.md`, "Closed sets" |
