# Research: Claude harness adapter (feature 125)

Decisions of Phase 0. Sources stay in `docs/ecosystem/`; this file summarizes and links.

| # | Decision | Rationale | Alternatives | Source |
|---|---|---|---|---|
| D-1 | One adapter, two transports; the subprocess is the default | The same engine runs behind both; one version pin; same shape as every other harness; subscription use only through the subprocess | SDK for both roles (conflicts with the terms position and adds a second pin) | R5 Q1, options A to C; rulings 20, 70 |
| D-2 | The SDK is an optional peer dependency, loaded at run time, never bundled | It is proprietary (not MIT); bundling it breaks decision 19 | Depend on it (a second licence in the package); vendor it | R1 F8, O3; ruling 20 |
| D-3 | Auth tier 1 isolation is the real home with customisations off | A throwaway home has no login at auth tier 1; copying credentials is rejected (rotation can invalidate the login) | A throwaway home plus a one-year token (auth tier 3 risk); API key (auth tier 2) | R5 Q7 options A to E; ruling 36 |
| D-4 | The critic at auth tier 1 is the CLI with no tools, proved from the initial record | The flag is a hope, the record is a fact; five independent layers keep the critic from the proposer's session | Trust the flags | R5 Q2; Principle IX |
| D-5 | The critic at auth tier 2 is a direct call | No session, no tool and no home by construction; it is the baseline's own transport | The CLI with `--bare` | R5 Q2 |
| D-6 | The permission mode is accept-edits with an allow list; the bypass mode only by the consumer's choice in user configuration, and then only with a sandbox and a non-root user, which the harness adapter checks | The CLI refuses bypass as root outside a sandbox; ruling 34 asks for the strongest containment | Keep bypass (the baseline) | R5 open question 1; R11 R-2; ruling 34; CQ-183 |
| D-7 | Never `--continue`; resume by minted id only | `--continue` picks up the newest session in the directory, including the consumer's own | Continue the latest | R5 Q4, F13; R24 |
| D-8 | Per-pass instructions go in the user prompt | The system prompt is recorded on the first request and reused | Change the system prompt per pass | R5 Q4, F16 |
| D-9 | Polite stop: an interrupt first, then termination | An interrupt ends the turn and keeps the session resumable; a termination leaves it unfinished | Terminate at once (the baseline) | R5 Q4, F17; R24 |
| D-10 | The critic is refused, not scored, when the proof fails | Feature 100 makes `critic_not_toolless` a configuration error that halts the run; the brief says "refused" | R5's "scored as a failed critic call" | F100-FR-087; brief 125 heading 4 |
| D-11 | The classifier reads the structured limit event first and the text second | Structured codes are stable; text is a fallback whose time is local and ambiguous | Text only | R14 B1 to B5; Lisa's harness |
| D-12 | Usage is reported as increments, null when unknown, notional at auth tier 1 | The cost of a continued session is cumulative; a killed pass has no final record | Sum the final records | R14 EV-03, EV-17, EV-24; R5 Q5 |
| D-13 | The model is stated by argument; the fallback-model argument is never passed | The model recorded must be the model used | Let the harness fall back | R25 F-2; R5 Q5 |
| D-14 | The model-tier ladder is data read at run time | Model names go stale; the ladder is pinned per run | Hard-code the ladder | R25 RT-D; Principle XII |
| D-15 | The SDK transport's version range is the 0.3 line from 0.3.284, with a warning outside it | A session interface was removed inside the line; the harness adapter uses only the call that starts a session with options | An exact pin | R5 F3, F37; decision 10 |
| D-16 | Lisa's harness is brought to the seam before its characterization tests | The permission bypass, missing session field, evidence polling and its retry contradict the seam | Pin them as they are | brief 125 heading 3 |
| D-17 | The direct call uses the built-in HTTP client and no SDK | Parity binds the exact headers and body; no dependency is needed | Lisa's messages adapter (MIT, but a dependency for one POST) | B-0980; R1 F10 |

Unresolved items reported to the orchestrator, each with a recommendation in `spec.md`: CQ-143 to
CQ-148. After the cross-feature review (2026-09-30) two more decisions hold. D-18: at auth tier 1 the
harness adapter writes nothing and removes nothing in the real home, a pass persists no session state and
continuation is off until capture E (nearest reading of Principle VIII; CQ-143; alternative rejected:
removal by minted id, which is a write). D-19: outside `parity` an unlisted model has no default window
(nearest reading of Principle IX; CQ-145; alternative rejected: the fallback of 200,000 as a floor). Facts that stay `unverified` until a capture or the probe: the sandbox write root,
concurrent sessions, the limit event on the CLI stream, the flag combination of the critic, the budget cap
under a subscription, the echo of the session id with no persistence, and every macOS behaviour.
