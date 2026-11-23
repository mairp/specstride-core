#!/usr/bin/env python3
"""Check inventory TSV rows: 6 columns, valid kind, evidence line exists and contains the needle."""
import re
import sys
from pathlib import Path

ROOTS = {"ss": Path("/tmp/specstride-research/R18/ss"), "mol": Path("/tmp/specstride-research/R18/mol")}
KINDS = {"cli-command", "cli-flag", "env", "event", "exit-code", "stop-reason", "file", "output-line", "behaviour"}
FORBIDDEN = re.compile("be" + "bop", re.I)


def main() -> int:
    path, which = Path(sys.argv[1]), sys.argv[2]
    root = ROOTS[which]
    cache: dict[str, list[str]] = {}
    failures = 0
    rows = 0
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not raw.strip():
            continue
        rows += 1
        cols = raw.split("\t")
        if len(cols) != 6:
            print(f"row {number}: {len(cols)} columns (need 6)")
            failures += 1
            continue
        system, kind, item, evidence, needle, coverage = cols
        if system not in {"SS", "MOL"}:
            print(f"row {number}: bad system {system!r}")
            failures += 1
        if kind not in KINDS:
            print(f"row {number}: bad kind {kind!r}")
            failures += 1
        if FORBIDDEN.search(raw):
            print(f"row {number}: forbidden machine-specific name present")
            failures += 1
        match = re.fullmatch(r"(.+):(\d+)", evidence.strip())
        if not match:
            print(f"row {number}: bad evidence {evidence!r}")
            failures += 1
            continue
        rel, line_no = match.group(1), int(match.group(2))
        if rel not in cache:
            target = root / rel
            if not target.is_file():
                print(f"row {number}: no such file {rel}")
                failures += 1
                continue
            cache[rel] = target.read_text(encoding="utf-8", errors="replace").splitlines()
        lines = cache[rel]
        if not 1 <= line_no <= len(lines):
            print(f"row {number}: line {line_no} out of range for {rel}")
            failures += 1
            continue
        if not needle or needle not in lines[line_no - 1]:
            print(f"row {number}: needle {needle!r} not on {rel}:{line_no} -> {lines[line_no - 1].strip()[:100]!r}")
            failures += 1
        if not coverage.strip():
            print(f"row {number}: empty coverage")
            failures += 1
    print(f"{rows} rows, {failures} failures")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
