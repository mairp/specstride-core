#!/usr/bin/env python3
"""Complete the bootstrap draft of a scenario of FX-35 or FX-36 deterministically.

A launch contract that the pipeline runtime or the supervisor can act on must be
`validated`, and `bootstrap_contract.py` writes a DRAFT: it leaves the stage graph
empty, every obligation `unresolved` and its own finding open, because deriving
them is the model's work. The oracle calls no model, so this program is the
deterministic completion of the draft — the same one the baseline's own tier-1
tests use (`tests/e2e/mol_e2e.py:reference_contract` at `9c88f86`), driven by the
stage graph the scenario declares beside it in `contract-patch.json`.

It is part of the fixture and not of the oracle: it holds no path of the machine,
reads no clock and asks nothing of the environment, and the same bytes run on both
sides. The status is NOT written here: `validate_contract.py --promote` is what
makes a contract `validated`, and the stamp it leaves is the file's own proof.

Usage: complete-contract.py <contract file> <patch file>
"""
import json
import sys


def main() -> int:
    contract_path, patch_path = sys.argv[1], sys.argv[2]
    with open(contract_path, encoding="utf-8") as handle:
        contract = json.load(handle)
    with open(patch_path, encoding="utf-8") as handle:
        patch = json.load(handle)

    contract["stages"] = json.loads(json.dumps(patch["stages"]))
    for key, value in (patch.get("configuration") or {}).items():
        contract.setdefault("configuration", {})[key] = value
    for key, value in (patch.get("contract") or {}).items():
        contract[key] = value

    # Every stage of the graph, and the first stage that Specstride itself runs: an
    # implementation obligation is mapped to a specstride stage and to nothing else
    # (the contract library of mixture-of-loops, `validate_contract`).
    every = [stage["id"] for stage in contract["stages"]]
    engine = [stage["id"] for stage in contract["stages"] if stage["kind"] == "specstride"]
    evidence = sorted({path for stage in contract["stages"]
                       for path in stage.get("evidence") or []})
    for index, entry in enumerate(contract["coverage"]):
        entry.update(
            disposition="mapped",
            producer="stage:" + (engine or every)[0],
            stage_ids=(engine or every) if index == 0 else every,
            evidence=evidence,
        )
    contract["findings"] = [
        dict(contract["findings"][0], status="resolved",
             resolution="Stages derived and mapped to every task.")
    ]
    with open(contract_path, "w", encoding="utf-8") as handle:
        json.dump(contract, handle, indent=2, sort_keys=True)
        handle.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
