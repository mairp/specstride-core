#!/usr/bin/env python3
"""Shape the records of a finished run into the one condition a scenario is about.

The supervisor of mixture-of-loops reads a run through three files it or the
runtime wrote: the launch record `harness-run.json`, the state record `state.json`
and the launcher log. `observe` and the relaunch classifier then decide from those
and from nothing else (`supervisor_lib.py:observe`,
`supervisor_lib.py:classify_relaunch`).

The scenarios of `observe-<status>` and `relaunch-<decision>` each need ONE of
those conditions. The records are not written by hand: the scenario runs
`supervise.py launch` first, so the baseline itself writes a real record with a
real contract digest, a real pid and real paths, and this program then changes the
one field the scenario is about. What it changes is named by the case, so the
fixture says which refusal it is driving.

Usage: shape-run.py <run dir> <case>
"""
import json
import pathlib
import sys
import time

DIGEST = "[DIGEST] state=%s exit=%d last-stage=%s child-exit=%s evidence=%s\n"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def save(path, value):
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> int:
    run_dir = pathlib.Path(sys.argv[1])
    case = sys.argv[2]
    record_path = run_dir / "harness-run.json"
    state_path = run_dir / "state.json"
    log_path = run_dir / "launcher.log"
    record = load(record_path)
    state = load(state_path)
    # The stage the member is about. It is the ENGINE stage by default and not the
    # stage the finished run stopped at: the recovery the relaunch classifier reads
    # (`retry_exit_codes`, `recovery.reason`) is declared on the engine stage, so a
    # case shaped onto the last stage of a completed run would be classified against
    # a stage that declares none.
    stage = sys.argv[3] if len(sys.argv) > 3 else "implement-feature"

    def digest(run_state, exit_code, child="None", last=None):
        """Append the launcher's own terminal line, which `observe` reads for the
        launcher exit, and leave the offset of the launch record pointing before it."""
        with log_path.open("a", encoding="utf-8") as handle:
            handle.write(DIGEST % (run_state, exit_code, last or stage, child, run_dir))

    def hide_the_digest():
        """Leave the run with NO terminal line of its own.

        Two files carry one: the launcher log, which `read_labels` reads from the
        offset the launch record holds, and the harness launch log, which `observe`
        falls back to when the first holds none (`supervisor_lib.py:observe`). The
        offset closes the first and the second is rewritten without its digest line,
        so a run that is gone without a terminal state really has none."""
        record["launcher_log_offset"] = log_path.stat().st_size if log_path.is_file() else 0
        launch_log = pathlib.Path(record["launch_log"])
        if launch_log.is_file():
            kept = [row for row in launch_log.read_text(encoding="utf-8").splitlines(True)
                    if not row.startswith("[DIGEST] ")]
            launch_log.write_text("".join(kept), encoding="utf-8")

    def alive_without_a_marker():
        """A pid that is certainly alive, and no command-line marker to narrow it by:
        `process_alive` then answers from the signal probe alone, which is the reading
        the supervisor makes of a launcher it did not start itself."""
        record["pid"] = 1
        record["cmdline_markers"] = []

    def stage_record(**fields):
        state["last_stage"] = stage
        state.setdefault("stages", {}).setdefault(stage, {}).update(fields)

    if case == "completed":
        pass                                        # the run ended well on its own
    elif case == "running":
        alive_without_a_marker()
        state["state"] = "running"
    elif case == "starting":
        alive_without_a_marker()
        state["state"] = "preflight"
    elif case == "failed":
        state["state"] = "failed"
        state["exit_reason"] = "exit"
        stage_record(status="failed", reason="exit", child_exit_code=4)
        digest("failed", 22, "4")
    elif case == "stopped":
        state["state"] = "stopped"
        state["exit_reason"] = "interrupted"
        stage_record(status="stopped", reason="interrupted", child_exit_code=130)
        digest("stopped", 130, "130")
    elif case == "unknown-terminal":
        state["state"] = "preflight"
        hide_the_digest()
    elif case == "lock-conflict":
        state["state"] = "failed"
        digest("failed", 24, "None", last="none")
    elif case == "operator-stop":
        state["state"] = "failed"
        stage_record(status="failed", reason="exit", child_exit_code=4)
        digest("failed", 22, "4")
        record["stop_requested"] = {"signal": 15, "at": time.time()}
    elif case == "unknown-launcher-exit":
        state["state"] = "failed"
        stage_record(status="failed", reason="exit", child_exit_code=4)
        hide_the_digest()
    elif case == "state-not-failed":
        state["state"] = "preflight"
        stage_record(status="failed", reason="exit", child_exit_code=4)
        digest("failed", 22, "4")
    elif case == "unknown-stage":
        state["state"] = "failed"
        state["last_stage"] = "no-such-stage"
        state.setdefault("stages", {})["no-such-stage"] = {
            "status": "failed", "reason": "exit", "child_exit_code": 4}
        digest("failed", 22, "4", last="no-such-stage")
    elif case.startswith("launcher-exit-"):
        state["state"] = "failed"
        stage_record(status="failed", reason="exit", child_exit_code=4)
        digest("failed", int(case[len("launcher-exit-"):]), "4")
    elif case.startswith("stage-reason-"):
        reason = case[len("stage-reason-"):]
        state["state"] = "failed"
        state["exit_reason"] = reason
        stage_record(status="failed", reason=reason, child_exit_code=4)
        digest("failed", 22, "4")
    elif case.startswith("child-exit-"):
        code = int(case[len("child-exit-"):])
        state["state"] = "failed"
        stage_record(status="failed", reason="exit", child_exit_code=code)
        digest("failed", 22, str(code))
    elif case == "contract-digest-changed":
        state["state"] = "failed"
        state["contract_digest"] = "0" * 64
        stage_record(status="failed", reason="exit", child_exit_code=4)
        digest("failed", 22, "4")
    elif case == "budget-exhausted":
        state["state"] = "failed"
        stage_record(status="failed", reason="exit", child_exit_code=4)
        digest("failed", 22, "4")
        record["relaunch_budget"]["remaining"] = 0
    elif case == "budget-deadline-exceeded":
        state["state"] = "failed"
        stage_record(status="failed", reason="exit", child_exit_code=4)
        digest("failed", 22, "4")
        record["relaunch_budget"]["deadline"] = record["first_launched_at"] - 1
    elif case == "transient":
        state["state"] = "failed"
        state["exit_reason"] = "exit"
        stage_record(status="failed", reason="exit", child_exit_code=4)
        digest("failed", 22, "4")
    else:
        print("shape-run: unknown case %s" % case, file=sys.stderr)
        return 2

    state["updated_at"] = int(time.time())
    save(state_path, state)
    save(record_path, record)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
