# Report to the orchestrator — feature 125-adapter-claude (T079, phase 9, 2026-10-28)

## 1. The readings of CQ-143 to CQ-148

All eight rows were raised by this feature and are closed in
`docs/ecosystem/CLARIFY-QUEUE.md` (owner rulings of 2026-09-30). The reading
this feature proceeds on, per row:

| CQ | Reading this feature proceeds on | Where it is carried |
|---|---|---|
| CQ-143 | The adapter writes nothing and removes nothing in the real configuration home; no session state is kept there at auth tier 1 and continuation is off until a capture shows the state can be redirected; what the harness writes by itself is captured (E) and left out of the byte comparison | F125-FR-014, F125-FR-015; `test/characterization/home-untouched.test.ts`; plan.md Complexity Tracking row VIII |
| CQ-144 | An initial record that shows a loaded plugin, host hook or tool server although customisations are off: a warning for a proposer (the pass goes on), a refusal for a critic | F125-FR-016; `test/characterization/init-assertions.test.ts`, `critic-proof.test.ts` |
| CQ-145 | An unlisted critic model is refused outside the `parity` profile; the as-is fallback of 200,000 tokens holds under `parity` only; a window the consumer declares always wins | F125-FR-027; `src/critic-direct.ts` (`contextWindowFor`); `test/characterization/critic-window.test.ts`; Complexity Tracking row IX |
| CQ-146 | The default per-call cap of the tier 1 critic is NONE until the paid probe (T076) fixes it; the doctor warns (`budgetCapMissing`); one turn, `maxTokens` 2048 and the prompt size bound the call | `data/models.json` (`budgetCaps.perCallUsd: null`); `packages/adapter-claude/test/fixtures/probe-log.md` |
| CQ-147 | Project instruction files are not loaded into a proposer pass: customisations off drops them, and the standing prompt is complete without them | F125-FR-015; `src/isolation.ts` |
| CQ-148 | The Agent SDK transport range is the 0.3 line from the tested 0.3.284, with a doctor warning outside it | F125-FR-038; `data/terms-rows.json` (`versionRange: ">=0.3.284 <0.4.0"`); `test/characterization/sdk-terms-range.test.ts` |

## 2. The readings of CQ-183 and CQ-191

- **CQ-183** (rows 100, 110, 130, 134, 138, 142): "user config" in rulings 34
  and P2 stands for the USER configuration only; the environment and a flag
  are not taken. Feature 125 carries the same reading for the bypass mode of
  `sandbox.permissionMode` (F125-FR-012): only user configuration turns the
  bypass mode on; the same value from the environment, a flag or project
  configuration is not taken, and the adapter never selects the mode by
  itself. Carried by `resolveBypassModeChoice` in
  `packages/adapter-claude/src/invoke-proposer.ts` and
  `test/characterization/bypass-precondition.test.ts` (CT-125-33). CQ-226
  (raised by this feature's repair report) applies the same reading to
  `harnesses.claude.transport`, which F125-FR-034 keeps.
- **CQ-191** (feature 115): an escalation rung that shares only the critic's
  model, at a higher effort, is ALLOWED with the same-model warning; only a
  rung equal in model and effort is skipped (ruling 49 over ruling 46).
  Feature 125's side of it is F125-FR-026 (`assumption: CQ-191`): the same
  model raises the critic-diversity warning; a higher effort on the same
  model raises the warning too, and neither is launch-blocking. Carried by
  `test/characterization/critic-tier.test.ts` (CT-125-20).

## 3. The alias and key names this feature proposes (annex X §X.7, rows 119 to 122)

The four rows exist in `specs/100-specstride/annexes/X-cross-layer.md`
(§X.7, rows 119–122) and this feature uses exactly these keys:

| Row | Key | Default | Under `parity` | Registered as |
|---|---|---|---|---|
| 119 | `harnesses.claude.proposerSkills` | off | off | DV-027 |
| 120 | `harnesses.claude.subprocessEnvScrub` | on | off | — |
| 121 | `harnesses.claude.gitInstructions` | unset | unset | DV-094 |
| 122 | `harnesses.claude.disableSubagents` | off | not used | — |

Alongside them, the as-is alias names of the critic's direct call
(F125-FR-029, kept from the baseline `lib/critic.py` at `9cab15d`): the key
`SPECSTRIDE_CLAUDE_CRITIC_API_KEY` else `ANTHROPIC_API_KEY`; the base address
`SPECSTRIDE_CLAUDE_CRITIC_BASE_URL` else `ANTHROPIC_BASE_URL` else
`https://api.anthropic.com`; the model `SPECSTRIDE_CLAUDE_CRITIC_MODEL` else
the default critic model; the context-window override
`SPECSTRIDE_CRITIC_CONTEXT_TOKENS` (and `roles.critic.contextTokens` in
configuration). Source of truth: `packages/adapter-claude/src/critic-direct.ts`.

## 4. Open work of this feature

Only the out-of-band paid items: the captures T001 to T004 (phase 1) and the
live probe calls of T076 (phase 9), each recorded `unverified` with its
reason in `.specstride/features/125-adapter-claude/verification-record.md`.
Nothing else is open.
