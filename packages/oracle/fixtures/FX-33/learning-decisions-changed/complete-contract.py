#!/usr/bin/env python3
"""Complete the bootstrap draft of FX-35 `dry-run@engine-stub` deterministically.

A launch contract that a dry run can inspect must be `validated`, and the
bootstrap tool of mixture-of-loops writes a DRAFT: it leaves the stage graph
empty, every obligation `unresolved` and its own finding open, because deriving
them is the model's work. The oracle calls no model, so this program is the
deterministic completion of the draft — the same one the baseline's own
tier-1 tests use (`tests/e2e/mol_e2e.py:reference_contract` at `9c88f86`),
written out here so that it is DATA of the fixture and the same bytes run on
both sides.

It is part of the fixture and not of the oracle: it holds no path of the
machine, reads no clock and asks nothing of the environment. The values it
writes come from the imported asset
`fixtures/assets/mixture-of-loops@9c88f86/tests/fixtures/expectations/greeting-ready.json`.

Usage: complete-contract.py <contract file>

The status is NOT written here: `validate_contract.py --promote` is what makes a
contract `validated`, and the stamp it leaves is the file's own proof.
"""
import json
import sys

FEATURE = "specs/001-greeting"
PREREQUISITE = "approvals/release-approval.json"
VERIFICATION = ["python3", "-m", "unittest", "discover", "-s", "tests", "-v"]

STAGES = [
    {
        "id": "implement-feature",
        "kind": "specstride",
        "depends_on": [],
        "cwd": ".",
        "action": {
            "argv": [
                "specstride", "run", "-w", ".", "-s", f"{FEATURE}/tasks.md",
                "--spec-format", "speckit-tasks", "--feature", "001-greeting",
            ],
            "timeout_seconds": 3600,
        },
        "preconditions": [
            {"type": "file_exists", "path": PREREQUISITE, "timing": "preflight"},
            {"type": "command_available", "name": "specstride", "timing": "preflight"},
        ],
        "postconditions": [{"type": "file_exists", "path": "src/greet.py"}],
        "evidence": ["src/greet.py"],
    },
    {
        "id": "verify-greeting",
        "kind": "command",
        "depends_on": ["implement-feature"],
        "cwd": ".",
        "action": {"argv": VERIFICATION, "timeout_seconds": 600},
        "preconditions": [],
        "postconditions": [{"type": "file_exists", "path": "tests/test_greet.py"}],
        "evidence": ["tests/test_greet.py"],
    },
]


def main() -> int:
    path = sys.argv[1]
    with open(path, encoding="utf-8") as handle:
        contract = json.load(handle)
    contract["stages"] = json.loads(json.dumps(STAGES))
    for entry in contract["coverage"]:
        first = entry["source"]["anchor"] == "T001"
        entry.update(
            disposition="mapped",
            producer="stage:implement-feature",
            stage_ids=["implement-feature"] if first else ["implement-feature", "verify-greeting"],
            evidence=["src/greet.py"],
        )
    contract["findings"] = [
        dict(
            contract["findings"][0],
            status="resolved",
            resolution="Stages derived and mapped to every task.",
        )
    ]
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(contract, handle, indent=2, sort_keys=True)
        handle.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
