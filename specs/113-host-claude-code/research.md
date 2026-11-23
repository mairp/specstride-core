# Research: Host plugin for Claude Code

Summary of reports in `docs/ecosystem/research/`. Nothing here is new evidence.

| Decision | Choice | Source |
|---|---|---|
| Packaging | One published package holds the plugin; thin shim; explicit plugin version; no install script | R3 F9 option A'; decision 19 |
| Marketplace | An npm-sourced plugin entry inside a marketplace hosted elsewhere; a marketplace cannot itself come from npm (documentation only, `unverified`) | R3v P26 |
| Host hooks | Session start, prompt submit, guard before shell, host limit events; no stop or after-tool injection | R3 F2; R14 |
| Push alert | A re-waking host hook is bound by its time limit; needs a long limit, re-arming, or the monitor | R3v C2 |
| Background job mode of the host | Considered and rejected as the runtime; `--exec` exists | R3v C1 |
| Budgets and checks of the build | 8k / 7k / 1.5k; seven checks; 2.8 bytes per token. The doctor body is at most 800 tokens (R17 allocation); feature 100 and the brief give only the total of 1,500 | R17 Part 2; ruling 65 |
| Evals | Free-grader trigger suite, no ablation on the runs that count for a release; exit 130 and 143 are interruptions. A run calls a model (each run of the host's suite runner is a full child of the host on the consumer's credential), so it is a paid task of a person and never a job of the build; the model comes from the configuration of the run | R3 F10; R3v C3, C7; R3v-host-facts-verification; Principle XII; CQ-188 (recommended answer) |
| Options field of the manifest | Raises the host version floor to 2.1.271 | R3v P31 |
| Context rules of host hooks | Plain output is context for four events | R3v C4 |
| Tier 1 child | Host hooks of the plugin run unless customizations are off | R3 open question 5; ruling 36 |
| Threats | T-09, T-11, T-12 (comment, digest, injection); T-43 to T-46 (supply chain, silent install). T-10 belongs to 107, 147 and 110. The controls are in `spec.md`, "Threats"; the control of T-43 is F100-FR-236 | R11; annex X §X.9 |
| Markers of the host | No logical name: annex B §B.5 has none for state in the data directory of a host. The markers are state of the host, read by nothing of the product | annex B §B.5; F100-FR-053 |

Open items are `unverified` and captured by tasks: lifetime of the re-waking host hook, search path of host hooks for `bin`, numeric limits of host hooks, the version floor, the first-launch notice.
