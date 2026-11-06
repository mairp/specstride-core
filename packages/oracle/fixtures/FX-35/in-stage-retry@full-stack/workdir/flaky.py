#!/usr/bin/env python3
"""Fail the first attempt and pass the second, with no clock and no randomness.

The attempt is counted in a file of the working directory, which is the only
state a stage of a launch contract has. `recovery.retry_exit_codes` of the stage
names the code this program exits with on its first attempt, so the pipeline
runtime's own in-stage recovery is what the scenario compares.
"""
import pathlib
import sys

counter = pathlib.Path('flaky.attempts')
attempt = int(counter.read_text()) + 1 if counter.is_file() else 1
counter.write_text(str(attempt) + '\n')
if attempt == 1:
    print('attempt 1 fails with the declared transient code', flush=True)
    raise SystemExit(4)
pathlib.Path('flaky.done').write_text('attempt ' + str(attempt) + '\n')
print('attempt ' + str(attempt) + ' succeeds', flush=True)
