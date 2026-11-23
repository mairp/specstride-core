# Quickstart: Codex harness adapter (feature 131)

No step calls a model.

1. Put the fake `codex` executable (`tests/conformance/codex/`) first on the search path.
2. Run the parity tests: `FX-01/harness-codex` and `FX-26/codex-text` under the `parity` profile. The stub transcript must equal the reference's (F131-FR-008).
3. Run the conformance suite of the harness port on the adapter. Expect: argument lists of the four shapes, standard input, environment allow-list, clean-up (F131-FR-039).
4. Run the form (a) tests: the fixture tree with notebook, handoff and outbox present before, absent during, present after; refusal when a moved file is still in the tree; refusal when the denial probe reports a readable path (F131-FR-018, F131-FR-019).
5. Run the form (b) tests against the fake endpoint: empty key (under the `parity` profile a failed critic call, as the code of the baseline scores it), empty choices, unknown window, listed window, cap (F131-FR-025 to F131-FR-031).
6. Replay JSONL streams through the mapping and the classifier fixtures; every classification carries `retryable` (F131-FR-032 to F131-FR-036). A case that needs a captured fixture is reported as a skip with its reason.
7. Run the critic-diversity test: the same model gives the warning and the call proceeds; two models of one provider give none (F131-FR-040).
8. Captures 1 to 5 and the three probes are made by an authorized person and logged. Captures 1, 2, 4 and 5 and the three probes are paid; capture 3 is not. They are not part of this quickstart, and no step above waits for them.
