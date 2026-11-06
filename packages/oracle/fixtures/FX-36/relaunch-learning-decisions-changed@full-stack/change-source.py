#!/usr/bin/env python3
"""Change a file the contract bound by hash, so the binding no longer holds.

Two refusals need it: `stale-sources`, where one of the contract's `sources` moves
under the launcher, and `learning-decisions-changed`, where the prefix of
Specstride's decision log that `configuration.learning` bound is no longer the same
bytes (the contract library of mixture-of-loops, `check_source_hashes`,
the contract library of mixture-of-loops, `learning_binding_problem`). The change is a fixed line, so two
runs of one side write the same bytes.

Usage: change-source.py <file> <line to append or replace>
"""
import pathlib
import sys


def main() -> int:
    path = pathlib.Path(sys.argv[1])
    text = sys.argv[2]
    if len(sys.argv) > 3 and sys.argv[3] == "--replace":
        path.write_text(text + "\n", encoding="utf-8")
    else:
        with path.open("a", encoding="utf-8") as handle:
            handle.write(text + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
