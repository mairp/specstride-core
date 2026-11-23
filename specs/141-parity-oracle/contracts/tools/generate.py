#!/usr/bin/env python3
"""Generator and check for the development data of feature 141.

Reads ../spec.md (the authority) and writes fixture-catalogue.json. With --check it writes nothing
and fails when a data file disagrees with spec.md, with the divergence register, or with the data
of feature 100. Standard library only. A tool of the specification, not a component of the product.
"""
import json, os, re, sys

HERE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
REPO = os.path.normpath(os.path.join(ROOT, "..", ".."))
SPEC = open(os.path.join(ROOT, "spec.md"), encoding="utf-8").read()
STUB = {"P": "proposer", "CH": "critic-http", "CC": "critic-cli", "D": "diagnostician", "E": "engine",
        "V": "verification-command", "I": "plugin-installer", "T": "telemetry-sink", "G": "generic"}


def cells(line):
    return [c.strip() for c in line.strip().strip("|").split("|")]


def section(start, end):
    a = SPEC.index(start)
    return SPEC[a:SPEC.index(end, a + 1)]


def catalogue():
    data = json.load(open(os.path.join(HERE, "surfaces.json")))
    run_set = data["runSet"]
    block = section("### §O.2", "### §O.3")
    families, scenarios = {}, {}
    for line in block.splitlines():
        if not line.startswith("| FX-"):
            continue
        c = cells(line)
        if len(c) == 7:
            surfaces = []
            for part in [p.strip().strip("`") for p in c[5].split(",")]:
                surfaces.extend(run_set if part == "Run set" else ([] if part in ("—", "") else [part]))
            stubs = sorted({STUB[s] for s in re.findall(r"\b(CH|CC|P|D|E|V|I|T|G)\b", c[4])})
            retired = "Retired" in c[2]
            families[c[0]] = {
                "id": c[0], "name": c[1], "status": "retired" if retired else "active",
                "exercises": c[2].replace("**", ""), "reference": c[3],
                "system": None if retired else ("specstride" if c[3].startswith("S,") else "mixture-of-loops"),
                "stubs": stubs, "surfaces": surfaces,
                "features": [] if c[6] == "none" else [f.strip() for f in c[6].split(",")],
                "variants": ["@engine-stub", "@full-stack"] if c[0] in ("FX-35", "FX-36") else [],
            }
        elif len(c) == 2:
            names = []
            for item in c[1].split(";"):
                m = re.search(r"`([^`]+)`", item)
                if not m or m.group(1).startswith("@"):
                    continue
                w = re.search(r"waiver (DV-\d{3})", item)
                names.append({"name": m.group(1), "pattern": "<" in m.group(1), "waiver": w.group(1) if w else None,
                              "scenarioOf": "141"})
            scenarios[c[0]] = names
    new = {}
    for line in block.splitlines():
        m = re.match(r"^\| (FX-\d{2}) \| Item (\d+)", line)
        if m:
            new[m.group(1)] = int(m.group(2))
    for fid, fam in families.items():
        fam["scenarios"] = scenarios.get(fid, [])
        fam["answersReservation"] = new.get(fid)
    problems = []

    def find(fid, name):
        return [x for x in families.get(fid, {}).get("scenarios", []) if x["name"] == name]

    reserved, refused = [], []
    for line in block.splitlines():
        c = cells(line) if line.startswith("|") else []
        # members of the pattern names: | FX-nn | `pattern` | members | source |
        if len(c) == 4 and re.match(r"^FX-\d{2}$", c[0]) and "<" in c[1]:
            pat = c[1].strip("`")
            hit = find(c[0], pat)
            if not hit:
                problems.append("%s: the pattern %s is not in the scenario table" % (c[0], pat))
                continue
            rx = re.compile("^" + re.sub(r"<[^>]+>", "[a-z0-9][a-z0-9-]*", re.escape(pat).replace("\\<", "<")
                                         .replace("\\>", ">").replace("\\-", "-")) + "$")
            members = re.findall(r"`([^`]+)`", c[2])
            for mem in members:
                if not rx.match(mem) or not re.match(r"^[a-z0-9][a-z0-9-]*$", mem):
                    problems.append("%s: %s is no member of the pattern %s" % (c[0], mem, pat))
            hit[0]["members"] = members
            hit[0]["source"] = c[3]
        # ends on the reference: | `FX-nn/name` | entry | end | stop reason | evidence | known by |
        elif len(c) == 6 and re.match(r"^`FX-\d{2}/[a-z0-9-]+`$", c[0]):
            fid, name = c[0].strip("`").split("/")
            hit = find(fid, name)
            if not hit:
                problems.append("%s/%s has an end on the reference and is not in the scenario table" % (fid, name))
                continue
            if c[5] not in ("run", "read"):
                problems.append("%s/%s: known by %s" % (fid, name, c[5]))
            hit[0]["endOnReference"] = {"entryPoint": c[1], "end": c[2], "stopReason": c[3], "evidence": c[4],
                                        "knownBy": c[5]}
        # scenarios added after the first set
        elif len(c) == 7 and re.match(r"^family FX-\d{2}$", c[0]):
            fid, name = c[0].split()[1], c[1].strip("`")
            extra = {"scenarioOf": c[2], "testOf": c[3], "stubsAndVerbs": c[4], "surfacesCompared": c[5],
                     "note": c[6]}
            hit = find(fid, name)
            if c[2] == "141":
                if not hit:
                    problems.append("%s/%s is a scenario of 141 and is not in the scenario table" % (fid, name))
                    continue
                hit[0].update(extra)
            else:
                if hit:
                    problems.append("%s/%s: the name is already in the scenario table" % (fid, name))
                    continue
                entry = {"name": name, "pattern": "<" in name, "waiver": None}
                entry.update(extra)
                families[fid]["scenarios"].append(entry)
        elif len(c) == 7 and c[0].startswith("families FX-"):
            reserved.append({"families": re.findall(r"FX-\d{2}", c[0]), "names": c[1].strip("`"),
                             "reservedBy": c[2], "note": c[6]})
        elif len(c) == 4 and c[0].startswith("family FX-"):
            refused.append({"families": re.findall(r"FX-\d{2}", c[0]), "asked": c[1].strip("`"),
                            "askedBy": c[2], "why": c[3]})
    for fid, fam in families.items():
        seen = {}
        for x in fam["scenarios"]:
            for n in [x["name"]] + x.get("members", []):
                if n in seen:
                    problems.append("%s: the name %s is used twice" % (fid, n))
                seen[n] = 1
            if x["pattern"] and x.get("scenarioOf") == "141" and not x.get("members"):
                problems.append("%s: the pattern %s has no members" % (fid, x["name"]))
    return {"schema": "urn:specstride:schema:internal:141:oracle-fixture-catalogue/1",
            "note": "Generated from spec.md §O.2 by contracts/tools/generate.py. spec.md stands where the two differ.",
            "families": [families[k] for k in sorted(families)],
            "reservedNames": reserved, "notScenarios": refused, "problems": problems}


def main():
    check = "--check" in sys.argv
    errors = []
    cat = catalogue()
    errors.extend(cat.pop("problems"))
    path = os.path.join(HERE, "fixture-catalogue.json")
    text = json.dumps(cat, indent=1, ensure_ascii=False) + "\n"
    if check:
        if not os.path.isfile(path) or open(path, encoding="utf-8").read() != text:
            errors.append("fixture-catalogue.json differs from spec.md §O.2")
    else:
        open(path, "w", encoding="utf-8").write(text)
    fams = cat["families"]
    ids = [f["id"] for f in fams]
    if ids != ["FX-%02d" % n for n in range(1, len(ids) + 1)]:
        errors.append("family ids are not FX-01 to FX-%02d without a gap" % len(ids))
    surf = {s["name"] for s in json.load(open(os.path.join(HERE, "surfaces.json")))["surfaces"]}
    for f in fams:
        if f["status"] == "active" and not f["scenarios"]:
            errors.append("%s has no scenario" % f["id"])
        if f["status"] == "retired" and f["scenarios"]:
            errors.append("%s is retired and has scenarios" % f["id"])
        for s in f["surfaces"]:
            if s not in surf:
                errors.append("%s names the unknown surface %s" % (f["id"], s))
        seen = set()
        for s in f["scenarios"]:
            if s["name"] in seen:
                errors.append("%s: scenario %s twice" % (f["id"], s["name"]))
            seen.add(s["name"])
    # surfaces of §O.4 against surfaces.json
    o4 = section("### §O.4", "### §O.5")
    named = re.findall(r"^\| (S-\d{2}) \| `([a-z-]+)`", o4, re.M)
    data = [(s["id"], s["name"]) for s in json.load(open(os.path.join(HERE, "surfaces.json")))["surfaces"]]
    if named != data:
        errors.append("surfaces.json differs from spec.md §O.4")
    # verbs of §O.3 against stub-vocabulary.json
    o3 = section("### §O.3", "### §O.4")
    verbs = set()
    for line in o3.splitlines():
        if line.startswith("| `"):
            verbs.update(re.findall(r"`([a-z-]+)`", cells(line)[0]))
    verbs.update(re.findall(r"`([a-z-]+)`", re.search(r"Verbs: ([^\n]+)", o3).group(1)))
    vocab = json.load(open(os.path.join(HERE, "stub-vocabulary.json")))
    have = {v for k in vocab["kinds"].values() for v in k["verbs"]}
    if verbs != have:
        errors.append("stub-vocabulary.json differs from spec.md §O.3: %s" % sorted(verbs ^ have))
    # register map against the divergence register
    cons = open(os.path.join(REPO, "docs", "ecosystem", "consolidation.md"), encoding="utf-8").read()
    cons = cons[cons.index("## 6. Divergence register"):]
    register = {}
    for line in cons.splitlines():
        m = re.match(r"^\| (DV-\d{3}) \|", line)
        if m:
            register[m.group(1)] = cells(line)[4]
    rmap = json.load(open(os.path.join(HERE, "register-map.json")))["rows"]
    if [r["row"] for r in sorted(rmap, key=lambda r: r["row"])] != sorted(register):
        errors.append("register-map.json does not hold exactly the rows of the register")
    rules = {r["Id"] for r in json.load(open(os.path.join(
        REPO, "specs", "100-specstride", "contracts", "data", "normalization.json")))["rules"]}
    for r in rmap:
        if r["registerText"] != register.get(r["row"]):
            errors.append("%s: the text of the register changed" % r["row"])
        for n in r["rules"]:
            if n not in rules:
                errors.append("%s names %s, which feature 100 does not hold" % (r["row"], n))
        if "waiver" in r["handling"] and "waiver" not in r["registerText"].lower():
            errors.append("%s: waiver without the word in the register" % r["row"])
    waived = {s["waiver"] for f in fams for s in f["scenarios"] if s["waiver"]}
    for dv in sorted(waived):
        row = [r for r in rmap if r["row"] == dv]
        if not row or "waiver" not in row[0]["handling"]:
            errors.append("%s: a scenario is waived by a row whose handling is not waiver" % dv)
    # every DV, FX, N and requirement id cited in the documents exists
    reqs = set(re.findall(r"^- \*\*(F141-(?:FR|SC)-\d{3})\*\*", SPEC, re.M))
    f100 = json.load(open(os.path.join(REPO, "specs", "100-specstride", "contracts", "requirements.json")))
    f100 = json.dumps(f100)
    for name in ("spec.md", "plan.md", "research.md", "data-model.md", "quickstart.md", "tasks.md"):
        p = os.path.join(ROOT, name)
        if not os.path.isfile(p):
            continue
        body = open(p, encoding="utf-8").read()
        for dv in set(re.findall(r"DV-\d{3}", body)):
            if dv not in register:
                errors.append("%s cites %s, which is not a register row" % (name, dv))
        for fx in set(re.findall(r"FX-\d{2}", body)):
            if fx not in ids:
                errors.append("%s cites %s, which is not in the catalogue" % (name, fx))
        for n in set(re.findall(r"\bN-\d{2}\b", body)):
            if n not in rules:
                errors.append("%s cites %s, which feature 100 does not hold" % (name, n))
        for r in set(re.findall(r"F141-(?:FR|SC)-\d{3}", body)):
            if r not in reqs:
                errors.append("%s cites %s, which does not exist" % (name, r))
        for r in set(re.findall(r"F100-FR-\d{3}", body)):
            if r not in f100:
                errors.append("%s cites %s, which feature 100 does not hold" % (name, r))
    for e in errors:
        print("FAIL", e)
    named = [s for f in fams for s in f["scenarios"]]
    print("%s: %d families, %d active, %d scenarios named (%d of them patterns with %d members; %d of other "
          "features), %d with an end on the reference, %d register rows, %d requirements"
          % ("checked" if check else "written", len(fams), sum(f["status"] == "active" for f in fams),
             len(named), sum(1 for s in named if s.get("members")), sum(len(s.get("members", [])) for s in named),
             sum(1 for s in named if s.get("scenarioOf") != "141"),
             sum(1 for s in named if s.get("endOnReference")), len(rmap), len(reqs)))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
