# Quickstart: validating run control

Run after the build. All steps use the stub agents of feature 141 and no model.

1. **Stop**: start a fixture run with a stub proposer that waits; run `stop`; expect the engine to exit 6, the stop reason `stop_flag`, no request left (F102-FR-003, F102-FR-004). Repeat with `stop --now`: the pass's processes end (F102-FR-006).
2. **Stop with no run**: on an idle workspace run `stop`; expect a warning and exit 0; then start the engine and expect that engine start to stop at once (F102-FR-002).
3. **Identity**: put a reused pid in the process registry; run `stop --now`; expect no signal (F102-SC-002).
4. **Refusals**: on a workspace without state expect exit 1, before any other check (F102-FR-012, CQ-184); with the lock held expect exit 5; with state and no snapshot expect exit 3; with a changed spec, plan, and task text expect exit 3 with the file named and the run read as `blocked-on-human`; with only a checkbox ticked expect no refusal (F102-SC-003).
5. **Accept**: after a spec change run `resume --accept-source-change`; expect the new hash in the snapshot, the counts unchanged, the event `source.change_accepted` in the event file, and a fact in the next critic input (F102-FR-019, F102-FR-020).
6. **Counts**: reject limit 3; stop and resume after two rejections; expect a halt at the next rejection (F102-SC-001). Resume with `--reset-counts`, then without: the counts carry (F102-SC-007).
7. **Snapshot**: plant a canary secret in configuration; expect only its reference in the snapshot; make the write fail; expect a launch error (F102-SC-005, F102-FR-025).
8. **Parity**: run FX-12 and FX-13 under the `parity` profile with the reset flag on resume fixtures; expect 0 results `different` (F102-SC-008).
