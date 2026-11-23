# Contract: host package for Claude Code

Implements `specstride.host/1` (annex H §H.1). Operations and errors are those of the annex; this file adds only the host's rendering.

| Operation | Output for this host |
|---|---|
| `describe` | Six capabilities with values and fallbacks; naming rule of skills; description cap 1,536 characters; packaging form: plugin directory |
| `renderSkill` | A skill directory with body and references; fails with `budget-exceeded` over the byte limit |
| `renderEntry` | The host's spelling of a command, for example `doctor` |
| `renderStatusHooks` | Shell shims that print the precomputed status line |
| `evalDriver.run` | One result per trigger case. The build calls it on a stub of the host's suite runner only; on the host's own runner it calls a model and is started by a person, as a paid task (F113-FR-038, F113-FR-041, `assumption: CQ-188`) |
