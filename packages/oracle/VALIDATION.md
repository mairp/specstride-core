# Validation of the oracle against quickstart.md (T148)

Every scenario of `specs/141-parity-oracle/quickstart.md` (lines 27 to 41),
run in phase 9 of the build and recorded here with its evidence. Where the
scenario names an `npm run oracle --` command, the command itself does not
exist yet — the oracle is a library plus its tests and the tier runner
(`src/cli.ts`) is not built (T-skeleton). What ran instead is the exact library
operation the command stands for, which is what the command will call; each
row says so. Nothing was skipped and nothing was faked: every live half ran
against the real clones at `<baseline>` (pin `9cab15d2d08f6c54644985f7251700bbdbcab282`)
and `<local-path>` (pin `9c88f86e1771efeabcfe3b4b1cb24384fff284e8`).

Evidence files, all under
`.specstride/features/141-parity-oracle/gates/proofs/`:
`phase9-quickstart-2-14.json` (scenarios 2 to 14, one JSON record each, from
the probe `phase9-tools/quickstart.ts`), `phase9-quickstart-1-15-commands.txt`
(scenarios 1 and 15, the two that are commands).

| # | Scenario (quickstart.md) | What ran | Result | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | `generate.py --check` → `checked: 40 families, 39 active, …`, exit 0 | the command itself | `checked: 40 families, 39 active, 255 scenarios named (13 of them patterns with 175 members; 21 of other features), 36 with an end on the reference, 120 register rows, 55 requirements`, rc 0 | pass | `phase9-quickstart-1-15-commands.txt` |
| 2 | fetch → two trees, each equal to its pinned tree hash, read-only; `git status` / `rev-parse HEAD` unchanged | the operation `fetchReferenceTree` stands for, for both systems, plus `treeFingerprint` vs the pin and `checkTreeUnchanged` after the runs of scenarios 3–5 | both commits are the pins, `treeHashMatchesPin: true`, `readOnly: true`, `cloneUnchanged: true`, `unchangedAfterRun: true` for both systems | pass | `phase9-quickstart-2-14.json` (`2-fetch-prep`) |
| 3 | run FX-01/three-phases reference,reference → every surface `equal` | `selfProof` (drives the live reference twice) | 9 surfaces `equal` (events, exit, home, processes, state, stderr, stdout, transcript, tree), `notEqual: []`, exit 0 | pass | `phase9-quickstart-2-14.json` (`3-self-proof`) |
| 4 | the same with `--seed-difference stdout` | `selfProofOfCaptures` with `seedDifference: "stdout"` | `notEqual: ["stdout"]`, the other 8 surfaces `equal`, `othersEqual: true` | pass | `phase9-quickstart-2-14.json` (`4-seed-difference`) |
| 5 | scenario 3 twice, compare the two normalized captures → equal | `surfacesThatDiffer` on the two normalized captures of the self-proof | `differingSurfaces: []` | pass | `phase9-quickstart-2-14.json` (`5-same-twice`) |
| 6 | probe → three phases, one rejection, exit 0, same tree twice | `probe` + `assertTheProbeHeldUp` on FX-02/reject-approve | `ran: true`, `phases: 3`, `rejections: 1`, `exitCode: 0`, `sameTreeTwice: true`, `heldUp: true` | pass | `phase9-quickstart-2-14.json` (`6-probe`) |
| 7 | run FX-38/installed-then-restart → as-is installer argv, receipt under its logical name, second pass ran | `driveSide` on the live reference | argv `["plugin","--profile","headless","add","--save-exact","@acme/stub-plugin@1.2.3"]` verbatim, receipt `.dsh/profiles/headless/plugins.json` = `{"plugins": ["@acme/stub-plugin@1.2.3"]}`, proposer calls 1 and 2, exit 0 | pass | `phase9-quickstart-2-14.json` (`7-fx38-installed-then-restart`) |
| 8 | a waiver that matches nothing → suite fails and names the waiver | `assertEveryWaiverMatchedSomething` on a `WaiverUse` with `matched: 0`, and `assertWaiverIsAllowed` on the same waiver | suite fails naming `FX-01/three-phases / stdout / DV-004 / stdout.lines[0]` (§O.5 rule 3, F141-FR-022); the acceptance side refuses a row the register does not hold, and this row it accepts (DV-004 is a register row, which is the point of the second half) | pass | `phase9-quickstart-2-14.json` (`8-waiver-matches-nothing`) |
| 9 | a rule that replaces nothing → suite fails and names the rule | `suiteReport` over a suite where every rule fires except N-25, then `assertEveryRuleEarnedItsPlace` | fails naming exactly `N-25 (counts what it left out)` (§O.5 rule 2, F141-FR-020) | pass | `phase9-quickstart-2-14.json` (`9-rule-replaces-nothing`) |
| 10 | a stub that connects to a public address → the run fails at the network guard | a child process that calls `installGuards()` then `connect({host: "93.184.216.34", port: 443})` | exit 96 (`NETWORK_GUARD_EXIT_CODE`), stderr `the oracle refuses a connection to 93.184.216.34:443: a run reaches no address other than loopback … (F141-FR-038)` | pass | `phase9-quickstart-2-14.json` (`10-network-guard`) |
| 11 | a test that cites FX-37 → refused, the family is retired | `violationsOfDeclaration` on a parity declaration with `fixture: FX-37/some-scenario` | refused with rule `F141-FR-027 retired family: FX-37 is retired: it keeps its id and has no scenario, and a test that cites it is refused (F141-FR-013)` | pass | `phase9-quickstart-2-14.json` (`11-fx37-refused`) |
| 12 | a test that claims an item its fixture did not execute → fails, names test and item | `checkItemClaim` with a map of FX-01/three-phases and a claim on B-0001 whose evidence is `lib/other.py:9999` | `result: "fail"`, message names `PT-141-901-scenario-twelve` and `B-0001` and the evidence line (F141-FR-032) | pass | `phase9-quickstart-2-14.json` (`12-claim-not-executed`) |
| 13 | suite2 on a port build whose layer writes one unnamed field → "possible breach of gate integrity" | `compareWithAllowlist` on two normalized captures where the port adds an event the allowlist does not name | 1 breach, failure `events-primary differs at unknown outside the layer allowlist: possible breach of gate integrity (F141-FR-040)` | pass | `phase9-quickstart-2-14.json` (`13-suite2-breach`) |
| 14 | release-check with one surface `different`, or one skip, or no macOS → blocked, with the cause | `releaseCheck` three times | all three blocked; causes `a surface reads different` / `a surface is a skip` / `no macOS runner has passed the oracle` respectively, each with the second-suite, live-run and dsh/Codex/prime causes the empty inputs honestly add | pass | `phase9-quickstart-2-14.json` (`14-release-check`) |
| 15 | `check-traceability.py` → `PASSED`; no `[h` line names 141 | the command itself | `PASSED: checks a to j`, rc 0; zero `[h` lines, so zero of them name 141 | pass | `phase9-quickstart-1-15-commands.txt` |

## Unverified statements

- **macOS**: no macOS runner exists in this lane (ruling 67). Every macOS
  statement of the spec stays `unverified`; scenario 14's `no macOS runner has
  passed the oracle` cause is the oracle itself saying the same thing.
- **The port**: no port build exists in this lane (T038, phase 4). Scenarios
  that need one (the port side of 3/5 in a full differential, and the tier
  runner commands) ran on the library operations that do not need it, as each
  row records.
- **Out of band, never run, never faked**: T067 and T074 (macOS-only).
