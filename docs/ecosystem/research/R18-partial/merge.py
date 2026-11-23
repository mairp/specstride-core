#!/usr/bin/env python3
"""Merge raw inventory TSVs into numbered B-items; write the markdown appendix and stats."""
import collections
import re
from pathlib import Path

RAW = Path("/tmp/specstride-research/R18/raw")
ORDER = ["ss-orchestrator", "ss-proposer", "ss-critic", "ss-frontdoor", "ss-reverse-spec",
         "ss-stream-telemetry", "mol-runtime", "mol-supervisor"]
KIND_ORDER = ["cli-command", "cli-flag", "env", "event", "exit-code", "stop-reason", "file",
              "output-line", "behaviour"]
SCRUB = [
    (re.compile("be" + "bop"), "<local-backend>"), (re.compile("BE" + "BOP"), "<LOCAL_BACKEND>"),
    (re.compile("Be" + "bop"), "<Local-backend>"),
    (re.compile(r"001-ainetops[a-z0-9-]*"), "<machine-specific feature>"),
    (re.compile(r"/root/ainetops-demo"), "<machine-specific workdir>"),
    (re.compile(r"/root/gpu_rtx_3090/?"), "<machine-specific path>/"),
    (re.compile(r"COMPASS"), "<GATEWAY>"), (re.compile(r"[Cc]ompass"), "<gateway>"),
]


def scrub(text: str) -> str:
    for pattern, replacement in SCRUB:
        text = pattern.sub(replacement, text)
    return text


def coverage(system: str, value: str) -> str:
    value = value.strip().replace("contracts/", "")
    prefix = "028" if system == "SS" else "011"
    value = re.sub(r"\(contract: ([a-z-]+\.md)\)", lambda m: f"({prefix} {m.group(1)})", value)
    value = value.replace(";0", "; 0")
    if "FR-" not in value and not value.startswith("none"):
        value = "none; " + value
    return value


def module_of(path: str) -> str:
    name = path.split("/")[-1]
    return re.sub(r"\.(py|sh|md|json|yml|yaml)$", "", name)


def main() -> None:
    rows, seen = [], set()
    for stem in ORDER:
        path = RAW / f"{stem}.tsv"
        if not path.is_file():
            print("MISSING", path)
            continue
        entries = []
        for raw in path.read_text(encoding="utf-8").splitlines():
            if not raw.strip():
                continue
            system, kind, item, evidence, _needle, cov = raw.split("\t")
            key = (system, kind, evidence, item[:60])
            if key in seen:
                continue
            seen.add(key)
            entries.append((system, kind, scrub(item), evidence, coverage(system, cov), stem))
        entries.sort(key=lambda e: (e[3].rsplit(":", 1)[0], KIND_ORDER.index(e[1]), int(e[3].rsplit(":", 1)[1])))
        rows.extend(entries)
    out = ["| B-item | System | Kind | Item | Evidence | As-is FR |", "|---|---|---|---|---|---|"]
    stats = collections.Counter()
    cluster = collections.OrderedDict()
    width = max(3, len(str(len(rows))))
    for index, (system, kind, item, evidence, cov, stem) in enumerate(rows, 1):
        bid = f"B-{index:0{width}d}"
        covered = "FR-" in cov
        stats[(system, "total")] += 1
        stats[(system, "covered" if covered else "uncovered")] += 1
        if not covered and "(" in cov:
            stats[(system, "contract-only")] += 1
        stats[(system, kind)] += 1
        ckey = (system, module_of(evidence.rsplit(":", 1)[0]), kind)
        entry = cluster.setdefault(ckey, [bid, bid, 0, 0])
        entry[1] = bid
        entry[2] += 1
        entry[3] += 0 if covered else 1
        cell = item.replace("|", "\\|")
        out.append(f"| {bid} | {system} | {kind} | {cell} | `{evidence}` | {cov} |")
    Path("/tmp/specstride-research/R18/appendix.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    lines = ["| Cluster | System | Module | Kind | B-items | Count | No covering FR |", "|---|---|---|---|---|---|---|"]
    for number, ((system, module, kind), (first, last, count, uncovered)) in enumerate(cluster.items(), 1):
        span = first if first == last else f"{first}…{last}"
        lines.append(f"| C-{number:03d} | {system} | `{module}` | {kind} | {span} | {count} | {uncovered} |")
    Path("/tmp/specstride-research/R18/clusters.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    for key in sorted(stats):
        print(key, stats[key])
    print("rows", len(rows), "clusters", len(cluster))


if __name__ == "__main__":
    main()
