# Contract: Event stream (`events.jsonl`)

**Surface**: the append-only JSON-lines event stream each run writes. The presenter, the inspection CLI, `lib/learn.py` and the telemetry shippers all read it. This file describes the current format only.

## Location

<!-- evidence: orchestrator.sh:627-634 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

`.specstride/features/<slug>/runs/<run-id>/events.jsonl`. The symlink `.specstride/events.jsonl` points at the newest run's file.

## Record shape (bash emitter `specstride_emit`)

<!-- evidence: specstride-lib.sh:103-124 | kind=observed | confidence=0.95 | contradicts=none | validation=verified -->

```json
{"ts":"<epoch.nanos>","time":"<ISO-8601>","event":"<name>",
 "run_id":"…","task":"…","backend":"…","feature":"…","trace_id":"…",
 "<key>":"<value>", "…":"…"}
```

- `ts`, `time` and `event` are always present. `run_id`, `task`, `backend`, `feature` and `trace_id` appear only when their environment variable is set.
- The remaining key/value pairs are call-specific. The bash emitter writes every value as a JSON string.
- Emitting is best-effort: a failed write never fails the loop.

## Record shape (Python emitters)

<!-- evidence: lib/critic.py:2417-2429, lib/learn.py:1191-1195 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

`lib/critic.py` `emit()` writes `ts` (`"%.6f"` epoch), `time` and `event`, plus typed fields with `None` values dropped. `lib/learn.py` appends `knob_adjusted` records with `event`, `ts`, `knob`, `phase`, `from`, `to`, `reason`, `metric`, `samples` and `run_id`.

## Event names observed in source (not exhaustive)

<!-- evidence: orchestrator.sh:963-963, orchestrator.sh:2275-2275, orchestrator.sh:765-766, orchestrator.sh:1085-1085, orchestrator.sh:1806-1806, proposer.sh:1543-1543, lib/critic.py:2750-2757 | kind=observed | confidence=0.80 | contradicts=none | validation=verified -->

`run_start` (with `workdir`, `phases` and `feature`), `run_end` (with `outcome=all_approved` and `phases`), `run_stop` (for example `reason=critic_unavailable`), `verdict` (with `phase`, `attempt`, `result` and `title`), `diagnostician_trigger`, `accelerator_start`, `knob_adjusted` and `yield_wait`. This reverse run did not enumerate the full set of event names.
