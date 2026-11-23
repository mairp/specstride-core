# Research: Parity oracle (feature 141)

Phase 0 of the plan. The research of this effort stays in `docs/ecosystem/`; this file says which
report settles what, records the decisions of the plan, and lists what is `unverified`.

## Sources

| Subject | Source | Used for |
|---|---|---|
| Design of the oracle | `docs/ecosystem/research/R18-behaviour-inventory-parity-oracle.md`, O-1 to O-12, F-17 to F-25 | Every requirement group |
| Behaviour inventory | `docs/ecosystem/research/R18-behaviour-inventory.tsv` | The exercise map; the items of FX-38 to FX-40 |
| Register and defect policy | `docs/ecosystem/consolidation.md` sections 4, 5, 6 | The register map; waivers; the supplement |
| Assignment of families | `docs/ecosystem/traceability.md` sections 1 and 5; the two data files | "Features covered"; the reservations |
| Normalization and profile | `specs/100-specstride/annexes/X-cross-layer.md` §X.7, §X.8 | Normalizer; second suite |
| Second suite | R23v V-19 and IR-52; R27 D1.1; R18 O-10 | F141-FR-039 to F141-FR-042 |
| dsh, pi, prime | `docs/ecosystem/research/R9-pi-dsh-prime.md` F2, F7, F11 to F14 | Harness stubs |
| Codex | `docs/ecosystem/research/R6-codex-openrouter-zai.md` | Harness stubs |
| Packages | R15 A-4; `specs/100-specstride/contracts/data/package-graph.json` | Structure |

## Decisions

### D-1 Where the reference output comes from

- **Decision**: hybrid. Committed golden captures for a change under review; a live differential run on Linux as the release condition; a capture job that fails when a golden capture differs from a fresh one.
- **Rationale**: decision 4 asks for both implementations on the same fixtures, which the release run does; a change under review must not need Python, bash 4 and the clones; the Specstride reference cannot run on macOS.
- **Alternatives considered**: live on every run (slow, fragile); golden captures only (the reference never runs, captures drift). R18, "Options compared".

### D-2 What is compared

- **Decision**: a logical model. Both captures are converted by the rules N-01 to N-29 and the tables of feature 100, then compared.
- **Rationale**: the state layout and the event schema are new on the port side; each rule names the field it touches and reports how often it fired.
- **Alternatives considered**: raw bytes after text substitution (broad patterns hide regressions).

### D-3 A family of its own for the dsh plugin request protocol (FX-38)

- **Decision**: FX-38, not scenarios inside FX-17 and FX-18.
- **Rationale**: read at the baseline (`proposer.sh:2047-2074` at `9cab15d`): the install is handled before the check for phase evidence; an installed plugin ends the pass with a restart, exempt from every breaker; only a refused or failed request (exit 7) and an install on the final pass (exit 4) share an exit code with FX-18 and FX-17. The subject of those two families is a breaker. 27 items: C-036 to C-040 (11) and 16 plugin items of the pass loop.
- **Alternatives considered**: scenarios inside FX-17 and FX-18, as the brief proposes first (the restart end has no home; the scope of two families would hold two subjects each).

### D-4 A family of its own for a declared overlay (FX-39)

- **Decision**: FX-39, declared through the as-is overlay variable of the harness.
- **Rationale**: no shipped registry entry declares an overlay (028 SC-007; the registry module at `9cab15d`), so every other family runs with scope `none`. The variable is in the environment alias table of feature 100, so both sides take the same declaration.
- **Alternatives considered**: characterization tests only (`traceability.md` section 5, item 2 names it as the fallback; the reference has the behaviour, so a parity test is possible and is preferred by Principle XVIII).

### D-5 A family of its own for a terminal (FX-40)

- **Decision**: FX-40 runs the front door on a pseudo-terminal; FX-28 keeps what needs none.
- **Rationale**: N-21 lets a fixture that tests colour compare escape sequences as written; every other family runs with colour off.
- **Alternatives considered**: a flag per scenario inside FX-28 (the surfaces of one family would then depend on the scenario).

### D-6 The home as a surface

- **Decision**: the surface `home` (S-13), beyond the list of R18 O-5.
- **Rationale**: the throwaway home of dsh, the overlay and the plugin install write outside the working directory; the as-is end-to-end tests of mixture-of-loops snapshot the home too (`tests/e2e/home_snapshot.py` at `9c88f86`).
- **Alternatives considered**: asserting only that the home is unchanged (misses what the overlay must create and remove).

### D-7 The second suite keeps compatibility output

- **Decision**: the profile `parity` with row 1 set to `micro` and nothing else (F100-FR-211; R27 D1.1). The surfaces `events-primary`, `control-records` and `counters` of the port are added, because the layer fields of DV-016, DV-017 and DV-052 are visible only there.
- **Rationale**: changing a second row would make the suite prove something else than inertness of one switch.
- **Alternatives considered**: default output on both captures, as register row DV-034 words it (then DV-018 is reachable, and the comparison A against the reference no longer carries over to B). Reported as CQ-028.

### D-8 The locally registered backend

- **Decision**: the name is derived at run time as the entries of the reference registry minus the carried entries, and is replaced before storage and comparison. No file holds it.
- **Rationale**: `STAGE-B-RULES.md` section 2; decision 19 (no name of the owner's machines); DV-064. The registry order is display order at the baseline, so outputs that list the registry hold the name.
- **Alternatives considered**: avoiding every scenario whose output lists the registry (items of C-032 to C-035 would lose their fixture). Reported as CQ-029.

### D-9 Pseudo-terminal without a native module

- **Decision**: `script(1)`.
- **Rationale**: Principle VI forbids a native module; both target systems ship the command. Its options differ between Linux and macOS, which the driver hides. `unverified` on macOS.
- **Alternatives considered**: a pseudo-terminal module from npm (native); the `pty` module of the reference interpreter (would put Python into the port side of the oracle).

### D-10 Claim of a cluster

- **Decision**: a cluster claim holds when every kept item of the cluster that belongs to the feature was executed by a fixture of a test of that feature that claims the cluster.
- **Rationale**: `STAGE-B-RULES.md` section 4 lets a cluster id stand for its items; R18 O-8 item 3 makes a claim a check.
- **Alternatives considered**: one executed item per cluster (too weak); every item named one by one (2,783 ids in task lists).

### D-11 Who writes scenarios

- **Decision**: this feature delivers the first set; a feature may add a scenario inside the scope of a family.
- **Rationale**: thirty features are specified in parallel and each knows its own edge cases; families, verbs and surfaces stay fixed here, so the comparison stays one. Reported as CQ-027.
- **Alternatives considered**: every scenario by feature 141 (one feature would carry the test design of thirty); families owned by features (no stable ids to cite).

### D-12 As-is assets

- **Decision**: imported unchanged into `packages/oracle/fixtures/assets/`, with the licence notice of their baseline; never in the product package.
- **Rationale**: brief 141, heading 2 ("the baseline's fixture files land here"); R15 A-4. Reported as CQ-030, since R18 leaves the licence question open.
- **Alternatives considered**: reading them from the reference tree at run time (the hermetic test tier would then need the clones).

## Facts that are `unverified`

| Fact | Requirement | Check that would verify it | Owner |
|---|---|---|---|
| Line tracing of the Python parts of the reference | F141-FR-031 | Run the capture job with tracing on one scenario of FX-29 and one of FX-35 | 141 |
| Every per-OS expectation | F141-FR-035 | The first run of the oracle on a macOS runner | 141 |
| That a macOS runner passes | F141-FR-036 | The platform job before a release | 141 |
| What the approval mode of dsh does in a headless run | F141-FR-015 | A capture by feature 130 | 130 |
| The structured quota event of Codex | F141-FR-015 | A capture by feature 131 | 131 |
| Run time of the full suite | plan, "Performance Goals" | Measured in the build; one scenario was measured (R18 F-18) | 141 |
| `script(1)` on macOS | D-9 | The platform job | 141 |

## Open points reported to the orchestrator

| # | Point |
|---|---|
| 1 | CQ-027 to CQ-030 (`spec.md`, "Assumptions") |
| 2 | The component-name table of feature 100 has no row for a registry entry that is not carried, and none for the stream tap, the two shippers, the overlay tool and the plugin request processor. N-15 compares a prefix outside the table as written |
| 3 | Register row DV-034 and F100-FR-211 disagree on the output mode of the second suite |
| 4 | Register row DV-056 says FX-37 is "retired with a waiver"; a waiver that matches nothing fails the suite, so no waiver entry is written |
| 5 | Check g of `check-traceability.py` accepts fixture families 1 to 37 only; FX-38 to FX-40 need the range widened, and 27 + 59 + the terminal items need their proof column changed |
| 6 | The two supplementary inventory rows (`contracts/inventory-supplement.tsv`) need ids in the inventory and rows in the traceability files |

## Follow-up after the fan-out (2026-09-29)

Facts that the follow-up took from the baselines. The reference was unpacked from `9cab15d` by an
archive into scratch, made read-only, and run under an empty environment with stub agents on the
search path and a stub critic on the loopback address. No model was called and no source
repository was written.

| Fact | Status | How |
|---|---|---|
| All six first scenarios of FX-07 end with engine exit 1 and the stop reason `critic_unavailable` | `verified-local` | Six runs; the critic module, lines 1883, 1904, 1963, 1978, 2370, 2395, 2729 to 2743 |
| Critic exit 3 has five causes, all before the critic call; the engine maps it to exit 3 and `critic_config` | `verified-local` | Five runs of the critic and three runs through the front door; the critic module, lines 2533 to 2562; the engine script, lines 2133 to 2136 |
| On the plain-output path a pass that ends with an exit code other than 0 is no error; the no-progress breaker ends the loop with pass-loop exit 8 | `verified-local` | Runs with the harnesses dsh, Codex and an unknown name; the pass-loop script, lines 2273 to 2350 |
| On the structured path a pass that fails before the harness starts is an error with the reason `launch_failed` or `producer_nonzero`; two end the loop with pass-loop exit 7 | `verified-local` | Runs with prime and its launcher; the pass-loop script, lines 2245 to 2261 |
| Two passes that the idle watchdog ends give pass-loop exit 7 on the plain-output path | `verified-local` | One run with a proposer that stays silent |
| The engine maps the pass-loop exits 4, 7, 8, 9 and 10 to engine exit 4 | `verified-local` for 4, 7 and 8; read for 9 and 10 | The engine script, lines 1888 to 1966 |
| Every run writes the plain banner and the rail into the engine log; the inspection commands never call the banner | `verified-local` | The engine log of a run; the engine script, lines 736 to 761 |
| The throwaway home of dsh fails to build only when a link or the settings file cannot be written | read | The pass-loop script, lines 407 to 433. No fixture made it fail |

- **Decision**: the catalogue follows the code (CQ-116, CQ-141), for all six scenarios and not only for the three that were reported.
- **Rationale**: parity means the code of the baseline. A scenario whose stated end the reference does not give would make the port wrong where it is right.
- **Alternatives considered**: a waiver per scenario (a waiver accepts a difference between the two sides, and here the two sides agree); new scenario names (an id is never renamed, and the features 124, 130, 131 and 138 cite the names).

- **Decision**: FX-07 keeps its id and its name and gains the scenarios that do reach engine exit 3.
- **Rationale**: the traceability rows B-0135, B-0151 and B-0226 and the requirement 028 FR-010 name FX-07 for the exit 3, and none of the first six scenarios executed their evidence lines.
- **Alternatives considered**: a new family (the subject is the same, and F141-FR-014 opens a family only when no scenario inside an existing one can execute an item).
