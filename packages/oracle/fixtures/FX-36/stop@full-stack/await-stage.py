#!/usr/bin/env python3
"""Wait until the pipeline runtime records that it is running a named stage.

The scenario of `supervise.py stop` has to send its stop while the run is in a
known place, or the capture would depend on how fast the stage before it was. The
runtime writes `state.json` before it starts each stage, so this waits for that
record and prints nothing.

Usage: await-stage.py <run dir> <stage id> [<seconds to wait at most>]
"""
import json
import pathlib
import sys
import time


def main() -> int:
    state_path = pathlib.Path(sys.argv[1]) / "state.json"
    stage = sys.argv[2]
    limit = float(sys.argv[3]) if len(sys.argv) > 3 else 120.0
    for _ in range(int(limit * 20)):
        try:
            state = json.loads(state_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            state = {}
        if state.get("last_stage") == stage and state.get("state") == "running":
            return 0
        if state.get("state") in ("completed", "failed", "stopped"):
            print("await-stage: the run ended before %s" % stage, file=sys.stderr)
            return 1
        time.sleep(0.05)
    print("await-stage: %s never started" % stage, file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
