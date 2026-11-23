# Research: Harness discovery (feature 146)

Phase 0 of the plan. The research itself is in `docs/ecosystem/research/`; this file records the
decisions this feature takes from it and links to the source. No unknown of the Technical Context
is left open.

| Report | What this feature takes from it |
|---|---|
| [R20](../../docs/ecosystem/research/R20-harness-discovery.md) | The seven sources, the two passes, the probe ladder, the four states, the precedence of the context window |
| [R16](../../docs/ecosystem/research/R16-doctor-config.md) | Keys `discovery.enabled`, `discovery.online` (confirmed, rows 87 and 88 of annex X §X.7); bounded probes (F2); the doctor checks `harness.*` |
| [R11](../../docs/ecosystem/research/R11-security-threat-model.md) | Threats T-13, T-15, T-16 |

## Decisions

### D-1 Two passes, and only the passive one is always safe

- **Decision**: a passive pass without network and without a resolved secret, and a metadata pass of GET requests.
- **Rationale**: R20 Q1; ruling 61 allows the credential on a free model list.
- **Alternatives considered**: no metadata pass (windows from declaration and catalogue only; fewer candidates qualify); a live catalogue fetch at launch (a call to a third party at every launch; rejected, R20 open question 5).

### D-2 Discovery is off under the `parity` profile

- **Decision**: both switches off under `parity`.
- **Rationale**: every stub invocation appends a transcript record (feature 141 §O.3 rule 4). A version probe would call a stub outside a pass and change a compared surface. Feature 100 asks for "off" where no as-is behaviour exists (F100-FR-212).
- **Alternatives considered**: a normalization rule that removes probe records (hides a line of the port, against feature 141 §O.5 rule 6).

### D-3 The guarded reader is the only way to the machine

- **Decision**: one module offers "is this variable set", "does this directory exist", "is this executable on the search path". It has no operation that opens a file below a configuration home, and it refuses paths on the deny-list.
- **Rationale**: the rule "never opens a credential store" becomes a property of one small module that a test can trace (F146-SC-002).
- **Alternatives considered**: a rule by convention in every source reader (not testable in one place).

### D-4 Requests with the `fetch` of the runtime, redirects handled by hand

- **Decision**: `redirect: "manual"`; any status of the 3xx class is a failure of the probe.
- **Rationale**: R20 F16: a redirect is refused so that the credential cannot reach another host; no dependency is added.
- **Alternatives considered**: an HTTP library (a dependency for one GET).

### D-5 Time limits and caps of probes

- **Decision**: 5 s per process, 3 s per request, 64 KiB of output, at most 8 probes at once; data of the plan.
- **Rationale**: R20 S2 and L3; R16 F2. Confidence low; the build measures.

### D-6 The safety margin of a window from the catalogue

- **Decision**: 20 per cent, as a key.
- **Rationale**: R20 Q4 recommends 20 per cent and leaves the figure to the owner of the critic.

### D-7 Logical names this feature needs

- **Decision**: annex B §B.5 names them (update of 2026-09-30): `package:harness:<id>` for a bundled harness descriptor and `package:catalogue` for the bundled catalogue snapshot.
- **Rationale**: F100-FR-053.
- **Earlier state**: the names were reported to the orchestrator as missing; annex B §B.5 now holds both. The requirement that reads the catalogue (F146-FR-016) names `package:catalogue`. Physical paths: feature 100's `physical-paths.json` gives the template of each under the root `package` (F100-FR-038 keeps the templates out of a specification); the workspace sources are `packages/harness/data/descriptors/` and `packages/harness/data/catalogue/` (`plan.md`, Storage; upstream fix U-1 of `analyze-report.md`).

## Facts that are `unverified`

| Fact | Check that would verify it |
|---|---|
| Every statement about macOS | A macOS runner passes the tests of this feature |
| A model-list endpoint is unbilled and takes the credential as declared | One logged request per provider the consumer uses |
| A gateway lists models of providers other than the host's | One logged request to a gateway |
| An existence query of a keychain that prints no value | The check of feature 100, F100-FR-107 |
