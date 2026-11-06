#!/usr/bin/env python3
"""Wait until the launcher the supervisor started has ended, and print nothing.

`supervise.py launch` starts the launcher DETACHED and returns at once, so a
scenario that only launched would be captured while the pipeline was still
running: the capture would hold whatever the run had reached by then, and the
`processes` surface would hold a process the run really did leave behind. This is
the scenario's own barrier. It polls the run's own records — the pid of the launch
record and the state the runtime writes — and prints nothing, so it adds no line to
any compared surface.

The poll interval is a span and not a clock; nothing of it reaches a surface.

Usage: await-run.py <run dir> [<seconds to wait at most>]
"""
import json
import os
import pathlib
import sys
import time

TERMINAL = ("completed", "failed", "stopped")


def alive(pid):
    try:
        os.kill(pid, 0)
    except (ProcessLookupError, TypeError):
        return False
    except PermissionError:
        return True
    try:
        line = pathlib.Path("/proc/%d/cmdline" % pid).read_bytes()
    except OSError:
        return True
    return bool(line)        # an exited-but-unreaped process has an empty one


def main() -> int:
    run_dir = pathlib.Path(sys.argv[1])
    limit = float(sys.argv[2]) if len(sys.argv) > 2 else 120.0
    record_path = run_dir / "harness-run.json"
    state_path = run_dir / "state.json"
    for _ in range(int(limit * 20)):
        try:
            record = json.loads(record_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            time.sleep(0.05)
            continue
        if not alive(record.get("pid")):
            try:
                state = json.loads(state_path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                state = {}
            if state.get("state") in TERMINAL:
                return 0
        time.sleep(0.05)
    print("await-run: the launcher did not end", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
