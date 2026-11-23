# Quickstart: validating feature 126

1. Replay the recorded Claude stream `claude-basic` through the `claude` reader; expect `init`, `text`, `tool`, `usage`, `terminal`.
2. Replay a plain-text stream; expect a synthesized `init` and `terminal`, both marked.
3. Register the data-only sample reader from the test tree; run the conformance suite; expect a pass with no core file changed.
4. Feed a tool output line that looks like a terminal record; expect no record. Feed a line over the cap; expect `stream.diagnostic`.
5. Kill a stub pass after two usage records; expect `usageComplete=false` and the partial usage.
6. Finalize each reason code of F126-FR-033; finalize again; expect no change.
7. Run FX-26 under the `parity` profile; expect 0 `different`.
8. Make the local append of one event fail in a stub writer; expect `event.dropped` before the next event and no call of any sink for the dropped event.
9. Open a stub sink and replay a stream; expect every event it receives to hold `ts`, `type` and `seq`, equal to the local line.
10. Give the data of a Wave 1 harness under another id; expect the same records, route and artifacts. Search the sources of the stream and invocation directories for a harness id in a condition; expect none.
11. Set `stream.tapExecutable` to a stub that exits 3, and to one that never ends; expect the pass not to fail and `parser_exit_code` in the producer status.
12. Replay a hand-written `sse-openai` and `sse-anthropic` stream; expect `init`, one `text` per block, `usage`, `terminal`, null cost; cut one before its end; expect `missing_terminal`. List the formats under `parity`; expect `claude` and `prime-v3` only.

No step needs a paid capture. A step whose fixture is absent is a skip with its reason.
