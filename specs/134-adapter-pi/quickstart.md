# Quickstart: Adapter for pi (feature 134)

How a reader checks the feature without pi installed.

1. Run the conformance suite of the harness port against the fake executable of the pi stub (feature 141 §O.3). It asserts the argument list of both roles, the prompt on standard input, the environment allow-list and the clean-up.
2. Replay `fixtures/proposer-pass.jsonl` and `fixtures/critic-call.jsonl` through the reader with the dialect `pi`. Both give the six normalized records and a terminal record. Replay a stream with a header of version 2: the reader ends in its unsupported-schema terminal.
3. Feed `fixtures/error-with-reset.json` and `fixtures/error-without-reset.json` to the classifier. The first gives `resetsAt` five hours later; the second gives null. Both have confidence `text`.
4. Launch with pi as proposer and no opt-in to C0: the launch is refused with the reason and the doctor line. Set the opt-in: the run record says `protection=detect`.
5. Configure the OAuth path of a Claude subscription: the terms gate refuses with the Tier 3 explanation and no pi process starts.
6. Replay a critic stream whose initial record lists a tool: the call ends with `critic_not_toolless`.

On a machine with pi, the four captures of `contracts/captures.json` are run only as authorized probes, each logged.
