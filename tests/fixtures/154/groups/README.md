# FX-154-GROUPS — `tests/fixtures/154/groups/`

The fixture of the layer and of groups as units (spec 154, `contracts/fixtures-154.json`,
`FX-154-GROUPS`). Created in phase 1 (T011) and committed with its approval (`ebd7c463`).

| File | What it holds |
|---|---|
| `tasks.md` | a phase whose plan holds three `[P]` groups with disjoint named paths |
| `config.json` | the stub configuration: `loop.parallel.units` on, every other switch off |
| `launch.json` | the launch record the stub engine reads |

Used by `packages/cli/test/engine/parallel-seams-154.test.ts` (T022) and
`temp-root-154.test.ts` (T025). This file was added on 2026-11-26 so that the critic, who reads
the attempt's change (`git diff HEAD` and the untracked files), can see that the directory
exists: a file committed in an earlier phase is never part of a later attempt's diff.
