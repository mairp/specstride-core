# Data Model: Host plugin for Claude Code

| Entity | Fields | Notes |
|---|---|---|
| Skill source | logical id, body, references with the condition of each, budget in bytes | Rendered per host; unknown id fails the build |
| Capability declaration | `hooks`, `statusSurface`, `background`, `evals`, `model`, `stateRootWritable`, each with value and fallback | Output of `describe` |
| Trigger case | prompt, kind (positive, negative, cross-skill), expected skill or none | Suite file; holds no model id |
| Check result | check, measured bytes, limit, verdict | Line of the report file |
| Host marker | last injected state, notice shown | State of the host, in the host's plugin data directory, outside the repository and outside the three roots; no logical name in annex B §B.5 (reported). No run and no command of the product reads it; a missing or damaged marker causes one more line |
| Log record of a paid task | date, task, model ids (from the configuration of the run), number of calls, cost, hash of the skill texts, result per skill, runs not scored | Written by a person's run; read by the release check, which calls no model |
