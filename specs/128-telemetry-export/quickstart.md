# Quickstart: checking feature 128

No step calls a paid model.

1. **Read the contract.** `spec.md` holds 45 requirements. `contracts/` holds the span scopes, the metrics, the attribute names, the keys and the payload forms as data.
2. **Check that a default run is silent.** Run any fixture with default configuration under a probe that counts network connections. The count for telemetry is 0 (F128-SC-001, test CT-128-22).
3. **Check the payloads against the baseline.** Start the telemetry sink stub of feature 141, run the fixture scenarios `loki-payload`, `otlp-payload` and `sink-down` of FX-31 under the `parity` profile. The comparator reports `equal`; `metric-names` and `delivery-status` report `waived (DV-058)` (F128-SC-006).
4. **Check that a dead collector changes nothing.** Run the conformance suite of EP-08 on both sinks with a slow sink, a throwing sink and a closed port. The exit code and the primary event file are equal (F128-SC-003).
5. **Check content.** Turn on the OTLP exporter and set nothing else: the spans of a pass and of a critic call carry content. Set `telemetry.content` to `off` in user configuration (the default is `auto`): none does. Plant the canaries of feature 111 with capture on: none appears (F128-SC-004, F128-SC-005).
6. **Check a real collector.** With a collector binary or image at hand, run `tests/e2e/128`: logs, metrics and traces of one fixture run are accepted and the delivery records say `accepted` (F128-SC-008). Without one the test is skipped with its reason.
7. **Look at the doctor facts.** With traces on, the facts of F128-FR-041 show the address, capture on and the version of the pattern set.
8. **Try the stack, if you want.** Copy `assets/telemetry/` out of the package `@specstride/observability`, run the compose file, and pass `--loki-url http://localhost:3110` to reach the shipped Loki. The product never starts it.
