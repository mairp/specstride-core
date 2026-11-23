# Quickstart: validating feature 110

Prerequisites: the product built; the oracle of feature 141; a temporary home and workspace.

1. Provenance: set `loop.maxIter` in the user file (10), the project file (5), the environment (`SPECSTRIDE_MAX_ITER=7`) and `--set loop.maxIter=3`; run `config show`. Expect 3 from `flag`, the others shadowed; the project value is accepted only if stricter.
2. Project narrowing: put `roles.critic.harness` and `telemetry.loki.url` in the project file; launch. Expect two launch messages, two doctor warnings, values ignored.
3. Strict schema: put `loop.maxIters` in a file. Expect a refusal naming `loop.maxIter`.
4. Aliases: run the oracle's alias fixtures with `SPECSTRIDE_PROPOSER_TIMEOUT=60`; expect `roles.proposer.timeoutSec` 60 from `environment`.
5. Profile: `--set profile=parity`; `config show --all` equals the column "Under `parity`" of annex X §X.7.
6. Secrets: set `roles.critic.credential=env:CANARY_KEY`; run the canary test; expect no canary in any artifact or argument list. Put a literal key instead; expect `inline-secret`.
7. Conformance: run the EP-10 suite on the sample (`test:` scheme).
