# Research: dsh harness adapter (feature 130)

Phase 0 of `plan.md`. Research and architecture stay in `docs/ecosystem/`; this file summarizes
what the plan takes from them and links to the source. No `NEEDS CLARIFICATION` remains. Six
captures are planned (F130-FR-042); the facts that wait for them stay `unverified`.

## Decisions

### D-1 A text adapter over the generic harness adapter

- **Decision**: a descriptor of kind `cli` with the stream format `text`, and three code hooks (overlay, patch and coverage, plugin protocol).
- **Rationale**: dsh prints only the final text; R9 recommendation 3 says "a dsh text adapter". The descriptor says what data can say; the hooks say what it cannot.
- **Alternatives considered**: the generic adapter with a descriptor only (loses the pin, the coverage check and the protocol); a bespoke adapter (duplicates the generic one).
- **Source**: `docs/ecosystem/research/R9-pi-dsh-prime.md` (F11, options B, recommendation 3); decision 17; `feature-briefs.md` brief 130, heading 4.

### D-2 An exact pin, `==0.1.0-rc.8`

- **Decision**: no range. Another version: a doctor warning for the proposer, a failure for the critic, launch-blocking when dsh is the critic.
- **Rationale**: the harness is a pre-release and its own trace plugin tracks a release-candidate seam. The critic's tool-lessness depends on the tool ids of one version.
- **Alternatives considered**: a range (the deny list could be stale inside it).
- **Source**: R9 "Version/date pins"; ruling 32b; decision 10.

### D-3 The critic is a deny list plus a coverage check

- **Decision**: the patch disables 18 tool ids. Before every critic call the adapter lists the ids the installed harness exposes and refuses the role when one is not covered. The proof is four recorded facts and is stated as weaker than an initial record.
- **Rationale**: a deny list goes stale when the harness or a plugin gains a tool; R9 F12 and R11 F-28 name this. Feature 100 admits the weaker proof for a tested adapter with a pin. The proof departs from the text of Principle IX and is a recorded deviation (CQ-182).
- **Alternatives considered**: an allow-list (the harness has none); read-only mode alone (a second layer, not a replacement, R9 F12); refusing dsh as critic.
- **Source**: R9 F12, open question 2; R11 F-28; F100 annex C §C.3; Principle IX.

### D-4 Model choice through a throwaway home

- **Decision**: the baseline's overlay is kept: link every entry of the real home except the settings file, write a new settings file, remove the home afterwards.
- **Rationale**: the harness composes a patch as the base and the settings file as the layer that wins, so a patch cannot select a model (verified 2026-08-31 at the baseline). The overlay meets the first half of ruling 36: the real home is read and never written. It does not meet the second half: every entry is linked, so the customisations of the profile are loaded (D-11).
- **Alternatives considered**: a patch (inert, as the baseline found); editing the real settings (forbidden by ruling 36).
- **Source**: baseline `proposer.sh` and `lib/critic.py` comments; R9 F2; ruling 36.

### D-5 The prompt is bounded and split at spaces

- **Decision**: one argument up to 120 KiB; above it chunks split only at spaces, none starting with a dash; a token over the limit fails.
- **Rationale**: Principle VIII bounds a prompt that cannot go on standard input. The critic path of the baseline already does this because the harness rejoins arguments with a space; the proposer path had a 151 KB failure at another harness of the baseline (a comment records "Argument list too long").
- **Alternatives considered**: one argument of any size (fails at the kernel limit).
- **Source**: baseline `lib/critic.py` `_dsh_task_args`; `proposer.sh` comment on the stdin file; Principle VIII. Register row DV-108.

### D-6 The table of bare ids is user configuration

- **Decision**: one built-in row (`glm-` to `zai`); the other row of the baseline names a route of the owner's machines and lives in user configuration.
- **Rationale**: no specification and no shipped file may name a route specific to the owner's machines. Parity fixtures supply the row through their configuration.
- **Alternatives considered**: ship both rows (breaks the naming rule); drop the table (breaks B-0677 and B-0984).
- **Source**: brief 130, heading 2; DV-064; register row DV-109.

### D-7 The plugin protocol is a code hook that ports the processor

- **Decision**: port `dsh_plugin_requests.py` function by function into `plugins/`, keep the two schema names, log names by component and logical name, and return the ends through `betweenPasses`.
- **Rationale**: 27 items; parity binds. `betweenPasses` already has the outcomes `stop` with 4 or 7 (annex C §C.1).
- **Alternatives considered**: a generic install mechanism (none is asked for; the harness's own `plugin` command is the one place).
- **Source**: baseline `lib/dsh_plugin_requests.py`, `proposer.sh` lines 2043 to 2075; F100 annex C §C.1; rulings 35, P15; DV-091.

### D-8 Usage is `none`

- **Decision**: `usageSource: none`, `usage.unavailable` with the reason `harness-does-not-report` for every pass; an estimate only if the consumer declares prices.
- **Rationale**: the headless application prints no usage (R9 F11); 989 passes of the baseline population recorded none (R14 B16). The trace plugin route (R14 B14) is not shipped.
- **Alternatives considered**: reading the trace plugin's spans (not shipped by ruling of the brief).
- **Source**: R14 B13, B14, B16, EV-16, rule 5.

### D-9 Containment C1, declared `unverified`

- **Decision**: the ceiling is C1 with the mark; `protection=detect`; parallel units off for this harness.
- **Rationale**: the permission mode is a setting of the harness; whether the operating system enforces it is not established. Ruling P2 requires C2 for parallel units.
- **Alternatives considered**: declare C2 (the runtime never asserts a sandbox, F100-FR-111).
- **Source**: R11 F-28, R-2; ruling P2; F100-FR-111, F100-FR-112.

### D-10 Both streams are scanned

- **Decision**: the form `dsh: <CODE>: <message>` is looked for on standard error and on standard output.
- **Rationale**: the critic of the baseline learned that context-window errors arrive on standard output.
- **Source**: R9 F13; R14 B13; baseline `lib/critic.py` comment on stdout.

### D-11 Customisations and native memory are reported, not switched off

- **Decision**: the adapter reports the switch of each kind of customisation and of native memory as null, the doctor warns, the state is recorded per run and per call, and dsh is a proposer only where the consumer names it. The critic role is refused outside `parity` unless native memory is shown to be off or absent.
- **Rationale**: no switch is known at the pin, and parity binds the argument list and the throwaway home. Principle VIII is NON-NEGOTIABLE, so the plan records a deviation and the owner decides (CQ-189). F100-FR-082 refuses a critic whose memory cannot be switched off; a state that is not established is read as not off.
- **Alternatives considered**: refusing dsh as proposer outside `parity` (the answer "otherwise" of CQ-189); a throwaway home without the customisations (which entries are customisations is not established); recording `off` on the strength of the patch file (nothing shows that it takes effect).
- **Source**: constitution v3.0.0, Principle VIII; rulings 36, 37, P14, P15; F100-FR-082, F100-FR-113; row 131 of annex X §X.7; CQ-189. The flags `--dump-config` and `--dump-default-config` of the launcher: `--help` of the installed command, verified-on 2026-09-30, pin 0.1.0-rc.8.

### D-12 The harness is never a default and never picked, under every audience

- **Decision**: the bar of ruling P14 has no condition on the audience and holds for both roles.
- **Rationale**: the ruling reads "usable when the consumer names it in config, with the unknown-terms warning; never a default; never picked automatically as critic", and F100-FR-093 states it without an audience.
- **Source**: `APPROVAL.md` ruling P14; F100-FR-093.

## Open items

| Item | State |
|---|---|
| Approval mode `ask` in a headless run | Capture 1 |
| Enforcement of the permission mode by the operating system | Capture 2 |
| Tool ids of the pinned version and the way to list them | Capture 3 |
| Rejoining of several task arguments on the proposer path; size of one argument | Capture 4 |
| Message forms of a limit; telemetry variable and its off value; trace parent | Capture 5 |
| What the profile loads into a call; native memory; a switch for either | Capture 6 |
| Terms and licence of the harness and of its upstream endpoints | The owner; the row stays absent |
