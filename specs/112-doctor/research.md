# Research: Doctor (feature 112)

Decisions of Phase 0. Sources stay in `docs/ecosystem/`; this file summarises and links.

| # | Decision | Reason | Source |
|---|---|---|---|
| D-1 | Lisa's finding model is extracted: id, severity, message, evidence, remedy; probes injected | A deterministic suite; prior art where 028 and 011 are silent | `R16-doctor-config.md` F1; Lisa `363e6a3` `packages/cli/src/commands/doctor.ts` |
| D-2 | A warning exits 0; a `fail` exits 2; `--strict` restores warn = 2 | The critic-diversity warning fires routinely | R16 F4; DV-041; ruling K6 |
| D-3 | Read-only; `--fix` deferred | "Changes no state" | R16 F2 |
| D-4 | The launch checks are the `lb` subset of the same registry | The doctor and the launch cannot disagree | R16 F2; EP-14; F100-FR-189 |
| D-5 | Ten checks carry `lb` | R16 marks 11, 17, 19, 22, 24, 28 (conditional), 30, 34, 35, 40 | R16 F3 |
| D-6 | 45th check `events.gateIntegrity` | R27 says the invariants are checked by the doctor and in CI; R16 has no id for it | R27 "Immediate revert"; R23 IR-28 |
| D-7 | Platform tools are evidence of `env.os` | Keeps the ids of R16 stable; one id each is a cheap change | `architecture.md` section 6 |
| D-8 | Output caps: 7 lines of 200 bytes; 1,700 bytes worst case | Inside the 800-token failure allowance of the output; the figure taken is the total of the brief, 1,500 tokens (4,200 bytes) for the whole doctor skill, with a body trimmed to fit; no figure of the body is fixed here (the host package owns the body) | R16 F4; R17; ruling 65 |
| D-9 | `--json` is not budgeted, never holds a secret or an account identifier | Opt-in (decision 16) | R16 F4 |
| D-10 | Keychain existence on Linux is `unprobed` | No non-printing query is known | R16 open question 5 |
| D-11 | A model-list GET is allowed, redirects refused | Ruling 61 | R20 S5, S6; R16 F2 |
| D-12 | Project files are parsed by a loader that runs no code | Cloned repository is untrusted | R16 open question 9; R11 T-13 |
| D-13 | The `hostile` fixtures are part of the tests | Same | R16 open question 9 |
| D-14 | `critic.diversity` reads the result of the diversity test and states no trigger: warn for `same-model` and `unverified`, info for `same-provider`, no finding for a shared model tier | One rule, stated once by its owner | F100-FR-024; annex E §E.1; row 183 of annex X §X.6 |
| D-15 | The code of a registered check lives in the package of its owner; the doctor renders what is registered | The registration call is in the kernel package so that an owner does not import the doctor | F100-FR-234; annex G §G.7, "Wave 1 implementations" |

## Facts that are `unverified`

| Fact | Check |
|---|---|
| The status commands of the harnesses change nothing and make no paid call | Each adapter's conformance run |
| Locations of managed settings of the host, and the host floors | Capture on a live host; macOS and Windows paths are recalled |
| Keychain existence queries on Linux and on macOS | A spike |
| The `--quick` time of 300 ms | The startup check on both platforms |
| Everything about macOS | The parity oracle and the conformance suites on a macOS runner |

## Spike T001: an existence query for a keychain reference that prints no value (2026-10-15)

Result of the hermetic part on Linux. The query of D-10 exists; the probe of `auth.<id>.<role>`
on Linux is no longer `unprobed` for the Secret Service (gnome-keyring) case. The query is:

- `secret-tool search [--all] <attribute> <value>` — it prints only the matched items'
  attribute pairs and item paths (with `--all`, every match), never a secret value. Its sibling
  `secret-tool lookup <attribute> <value>` prints the secret itself and is excluded from the doctor.
  An absent item prints nothing and exits 0. Exit status does not distinguish found from absent:
  the probe reads the printed lines, not the code.

Run, hermetic, in a throwaway D-Bus session on the build container (no display, no paid call,
no secret read; a fresh throwaway keyring, nothing of the machine):

- `dbus-run-session -- gnome-keyring-daemon --start --components=secrets` then
  `secret-tool search --all xdg:schema org.specstride.probe` → exit 0, no output (absent item).
- Storing a probe item failed hermetically: creating/unlocking the default collection raises the
  gcr prompter, which needs a display. An existence query against a *populated* collection was
  therefore not exercised — recorded `unverified: no unlocked collection exists in a headless
  session; storing an item needs an interactive unlock prompt`.

Tool versions observed (Linux, Debian, `dpkg`):

| Tool | Version | Note |
|---|---|---|
| `secret-tool` (libsecret-tools / libsecret-1-0) | 0.21.7-1 | the Secret Service CLI |
| `gnome-keyring-daemon` (gnome-keyring) | 48.0-1 | the Secret Service provider probed |
| `keepassxc-cli` (keepassxc-full) | 2.7.10+dfsg1-1 | present; no non-printing existence query documented (`db-info` lists entries only through `ls`, which prints entry names — candidate for a later note, not probed) |
| Node.js | v22.23.2 | the runtime of the doctor |
| D-Bus (`dbus-run-session`) | session-scoped wrapper used for the probe | |

macOS part: `unverified: the owner's out-of-band ruling of 2026-09-30 — a macOS runner is never
run and never faked in this lane. The candidate query there is "security find-generic-password"
with its output flags suppressed, which is documented to print nothing on a miss and never to
print the password without an interactive prompt; it stays for the owner's macOS runner.` The
record of this spike is in this feature's verification record.
