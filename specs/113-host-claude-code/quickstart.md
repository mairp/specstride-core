# Quickstart: Host plugin for Claude Code

1. Build the package; the plugin directory appears with three skills.
2. Run the seven checks of the context-cost CI; all pass. No step of the build calls a model.
3. Run the conformance suite against the plain shell and the plugin on fixture `greeting-ready`.
4. Run the static check of the suite files and the eval driver on the stub runner. The trigger suite itself is a paid task: a person starts it, with the model from the configuration of the run, and the run is logged; each skill fires on its positive cases only.
5. On a live host, invoke `specstride-run` with the mode `dry-run`; a plan is printed and nothing starts.
