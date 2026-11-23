# Quickstart: validating Presenter

Prerequisites: the oracle of feature 141 with FX-01, FX-02, FX-28 and FX-40, stub agents, a pseudo-terminal harness, Node 22.

1. Run the parity tests of `tests/parity/145/` in compatibility output: the presenter's lines on FX-01 and FX-02 are `equal`.
2. On a pseudo-terminal run FX-40: `banner`, `timeline-live`, `colour-detected`, `colour-never`.
3. With `NO_COLOR=1` and no `--color`, the output holds no escape sequence.
4. Run the colour table test: every combination of the variables gives the depth of F145-FR-012.
5. Kill the presenter during a fixture run: the run's outcome and exit code are unchanged (F145-SC-003).
6. Run the characterization tests `CT-145-1` and `CT-145-2`.
