#!/usr/bin/env python3
"""Change the launch contract INSIDE the published bundle, after the launcher was
rendered from a good one.

The launch gate of the supervisor checks the launcher's own digest first and the
contract second (`supervisor_lib.py:gate`), and the launcher's digest covers the
launcher and not the bundle. A refusal about the CONTRACT therefore needs a
launcher that is intact and a bundle contract that is not, which is what this
program makes. Each case names the one refusal it drives.

Usage: patch-bundle.py <launcher> <case>
"""
import json
import pathlib
import re
import sys

BUNDLE_DIR_RE = re.compile(r'^BUNDLE_DIR="\$SCRIPT_DIR/(?P<relative>.*)"$', re.MULTILINE)
ENTRY_RE = re.compile(r'exec python3 "\$BUNDLE_DIR/(?P<entry>[^"]+)"')


def bundle_of(launcher):
    found = BUNDLE_DIR_RE.search(launcher.read_text(encoding="utf-8"))
    if not found:
        raise SystemExit("patch-bundle: %s names no bundle" % launcher)
    return (launcher.parent / found.group("relative")).resolve()


def main() -> int:
    launcher = pathlib.Path(sys.argv[1]).resolve()
    case = sys.argv[2]
    bundle = bundle_of(launcher)
    path = bundle / "launch-contract.json"
    contract = json.loads(path.read_text(encoding="utf-8"))

    if case == "open-blocker":
        contract["findings"][0].update(severity="blocker", status="open")
    elif case == "draft":
        contract["status"] = "draft"
    elif case == "invalid":
        contract["schema_version"] = "mol.launch-contract/0"
    elif case == "unauthorized-root":
        # The repository root has to fall OUTSIDE authorized_roots while everything
        # the validator resolves still falls inside, so the gate reaches its third
        # check and refuses there. Narrowing the roots to `<root>/specs` and moving
        # every stage into it does that; the inventory's prerequisites are marked
        # absent, because a prerequisite that is present must be checked by a stage
        # precondition and the preconditions are what move out of reach.
        root = contract["repository"]["root"]
        contract["authorized_roots"] = [root + "/specs"]
        for stage in contract["stages"]:
            stage["cwd"] = "specs"
            stage["preconditions"] = []
        for entry in (contract.get("inventory") or {}).get("prerequisites") or []:
            entry["present"] = False
    elif case == "drop-the-entry":
        # The launcher's dry run has to fail while the gate's own reading of the
        # bundle still passes, so what is removed is the file the LAUNCHER execs —
        # read off the launcher, not named here — and not the contract, which the
        # gate reads itself and would refuse one check earlier.
        entry = ENTRY_RE.search(launcher.read_text(encoding="utf-8"))
        if not entry:
            raise SystemExit("patch-bundle: %s execs nothing of its bundle" % launcher)
        (bundle / entry.group("entry")).unlink()
        return 0
    else:
        print("patch-bundle: unknown case %s" % case, file=sys.stderr)
        return 2

    path.write_text(json.dumps(contract, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
