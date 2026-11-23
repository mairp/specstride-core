#!/usr/bin/env python3
"""Resolve (file, needle, hint) to file:line and write inventory TSV rows."""
from pathlib import Path

ROOTS = {"SS": Path("/tmp/specstride-research/R18/ss"), "MOL": Path("/tmp/specstride-research/R18/mol")}
_cache: dict = {}


def lines_of(system: str, rel: str) -> list:
    key = (system, rel)
    if key not in _cache:
        _cache[key] = (ROOTS[system] / rel).read_text(encoding="utf-8", errors="replace").splitlines()
    return _cache[key]


def resolve(system: str, rel: str, needle: str, hint: int = 0) -> int:
    hits = [i for i, line in enumerate(lines_of(system, rel), 1) if needle in line]
    if not hits:
        raise SystemExit(f"needle not found: {rel}: {needle!r}")
    return min(hits, key=lambda n: abs(n - hint)) if hint else hits[0]


def write(system: str, rows: list, out: str) -> None:
    rendered = []
    for row in rows:
        kind, item, rel, needle, coverage = row[:5]
        hint = row[5] if len(row) > 5 else 0
        line = resolve(system, rel, needle, hint)
        for col in (kind, item, rel, needle, coverage):
            assert "\t" not in col and "\n" not in col, col
        rendered.append("\t".join([system, kind, item, f"{rel}:{line}", needle, coverage]))
    Path(out).write_text("\n".join(rendered) + "\n", encoding="utf-8")
    print(f"{len(rendered)} rows -> {out}")
