# Fixtures of spec 154 (T011)

The fixture directories named by
`specs/154-concurrency-and-parallelism/contracts/fixtures-154.json`, one per
`FX-154-*` id (the `door` directory holds FX-154-DOOR). Each holds the static
parts of its fixture: the task list (`tasks.md`), a stub launch contract
(`launch.json`, `specstride.launch/1`) and the stub configuration
(`config.json`, the user-level file). No fixture holds a binary, a key or a
recorded model call: every test that uses a fixture copies it into a working
directory of its own and drives the engine with a stub executable it writes
(FX-PAR-S; no paid or external model API, F154-FR-018).

| Directory | Fixture | Slice |
|---|---|---|
| `plan/` | FX-154-PLAN | P1 |
| `groups/` | FX-154-GROUPS | P2, P3 |
| `slots/` | FX-154-SLOTS | P4 |
| `stages/` | FX-154-STAGES | P5 |
| `phases/` | FX-154-PHASES | P6 |
| `spec/` | FX-154-SPEC | P7 |
| `door/` | FX-154-DOOR | P2 (the second worker door) |

Every switch named in a `config.json` here is OFF: these are the
switches-off fixtures of the inertness tests (`tests/inertness/154/`), the
baseline against which a trial turns exactly one switch on (F154-FR-018).
`parity-baseline/` holds the event files of the recorded run of `groups/`
with the feature absent, and its README names the commit.
