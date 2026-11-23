# Quickstart: validating feature 147

Prerequisites: the product built; a temporary home and workspace.

1. With `distribution.audience=distributed` ask for Claude at Tier 1: expect `personal-only` and Tier 2 as the default. Add an acknowledgement in the user file: expect Tier 1 with a warning and a recorded event.
2. Set `personal`: expect Tier 1 `allowed`.
3. Set Tier 3 anywhere: expect a refusal with the explanation.
4. Name a harness with no row: expect the unknown-terms warning, Tier 1 or 2, never a default.
5. Place a newer valid file, then a broken one, in user-level state: expect replacement, then the shipped file and a doctor finding.
6. Run the EP-11 conformance suite with a fictional provider in a test overlay: the decision changes with no code change.
