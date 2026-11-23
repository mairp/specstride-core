# Quickstart: Claude harness adapter (feature 125)

Prerequisites: the package built; the stub executable `claude` and the critic stub of feature 141; the
recorded streams of the harness adapter. No login, no key and no model call is needed.

1. Detect: point the search path at the stub; the doctor reports the executable, the version and the state `tested` (F125-FR-001, F125-FR-006).
2. Parity: run FX-01 `harness-claude` with the `parity` profile; the transcript holds the as-is argument list and `SPECSTRIDE_STDIN_FILE`; the prompt file is gone afterwards (F125-FR-007 to F125-FR-009).
3. Default: run it with the default profile; the argument list matches `contracts/argument-table.md`; the call states accept-edits and a minted session id (F125-FR-012, F125-FR-013).
4. Continuation: at auth tier 2 run two passes in one attempt; the second resumes by id; run a relaunch; it starts fresh. At auth tier 1 both passes are fresh and persist nothing (F125-FR-013, F125-FR-014).
5. Critic proof: replay an initial record with one tool, with a foreign session id and with no record; each is refused `critic_not_toolless` (F125-FR-024).
6. Quota: replay the recorded limit event (written from the documented shape; the captured one is used when capture C exists, else that case is a skip), the retry event and the overload; the classes are those of `contracts/classifier-table.md` (F125-FR-031).
7. SDK absent: choose the SDK transport at auth tier 2 with no SDK installed; the transport is unavailable and the subprocess run is unchanged. Choose it at auth tier 1: refused (F125-FR-034, F125-FR-036).
8. Package check: pack the package and list its files; no path of the SDK (F125-SC-004).

Contracts: [contracts/README.md](contracts/README.md).
