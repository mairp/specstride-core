#!/usr/bin/env python3
"""Coverage check for docs/ecosystem/traceability.md and its companions.

First half of the coverage check of the cross-feature review (prompt section 6, item 1).
Standard library only. Exit 0 when every check passes, 1 when one fails, 2 when an input is missing.

The owner approved Stage A on 2026-09-29 (APPROVAL.md). Wave 1 has 31 features and the umbrella, and the
divergence register has 91 rows, DV-001 to DV-091.

Checks
  a  110 FRs and 23 SCs are present, each once, each with exactly one valid disposition
  b  the 2,785 behaviour items B-0001 to B-2785 are present exactly once
  c  every destination is a Wave 1 feature of architecture.md section 14, a later-wave feature of
     roadmap.md, a named roadmap entry, or `none` for a dropped row; no feature is in both files
  d  every cited DV row exists in the divergence register of consolidation.md, which holds DV-001 to DV-091
  e  every `deferred` row names a wave and a roadmap entry that exists
  f  traceability.md agrees with the two TSV files: the same disposition and destination for every id
     in both places, the clusters and item ranges, and the counts of section 4.1
  g  every row carries the proof its disposition requires; every `superseded-by` and `dropped` row of
     section 2 carries the owner's approval, and no row still asks for a ruling

The second half (rows against the specs of Stage B) is `check_specs`, checks h1 to h4, i and j. It
reads the specs that exist; with `--require-all` a Wave 1 feature without spec.md or tasks.md fails.

  i  every `fixture:` of a declaration of §O.6 names a family of the fixture catalogue of
     feature 141 that is not retired (F141-FR-034)
  j  where an exercise map has been captured, every claim passes F141-FR-032: a test may claim a
     behaviour item only if a fixture it names executed the evidence line of that item, and a
     claim of a cluster holds when every kept item of the cluster that belongs to the feature of
     the test was executed by a fixture of a test of that feature that claims the cluster

Checks i and j were added by feature 141 (T086). Two further changes of that task were already in
the script and are confirmed here rather than made again: check g accepts the fixture families
FX-38 to FX-40 that feature 141 added (`1 <= int(family) <= 40`), and check d reads the number of
rows of the divergence register OUT OF the register (`n_register = max(...)`) instead of holding a
constant, so the register may grow with each analyze run.
"""
import collections
import csv
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(HERE, *a)

WAVE1 = [
    "100-specstride", "141-parity-oracle", "101-gate-and-verdict", "117-critic-grounding-and-prompt",
    "102-run-control", "119-front-door-and-presenter", "103-proposer-pass", "118-pass-supervision-and-jobs",
    "104-spec-input", "105-verification", "106-learning", "107-launch-contract",
    "123-pipeline-runtime-and-supervisor", "122-detached-runtime", "108-reverse", "109-harness-seam",
    "124-harness-discovery-and-roles", "125-adapter-claude", "126-stream-seam-and-invocation",
    "110-config-and-terms", "127-quota-budgets-and-pause", "111-event-schema-and-projection",
    "128-telemetry-export", "129-run-view-and-status", "112-doctor", "113-host-claude-code",
    "115-micro-loop-layer",
    # added by the owner on 2026-09-29: rulings 32, 32a, 32b (adapters) and 56, D2, D3 (parallel units)
    "130-adapter-dsh", "131-adapter-codex", "134-adapter-pi", "138-adapter-prime",
    "142-parallel-units",
    "144-compatibility-projection",  # split of 111-event-schema-and-projection
    "140-reverse-inventory-and-lint",  # split of 108-reverse
    "145-presenter",  # split of 119-front-door-and-presenter
    "147-terms-gate",  # split of 110-config-and-terms
    "149-attempt-planner-and-seams",  # split of 101-gate-and-verdict
    "148-check-runner",  # split of 105-verification
    "146-harness-discovery",  # split of 124-harness-discovery-and-roles
    "143-parallel-engine-services",  # split of 142-parallel-units
    "116-check-integrity-and-unit-evidence",  # split of 115-micro-loop-layer
]
LATER = ["120-host-dsh", "121-kanban-ui", "132-adapter-gemini-cli", "133-adapter-copilot",
         "135-adapter-opencode", "136-adapter-openrouter", "137-adapter-zai", "139-adapter-specstride"]
N_WAVE1 = 41  # 31 features and the umbrella, 100-specstride
APPROVED = "approved 2026-09-29 (ruling K8)"
UNUSED = ("114",)
EXPECTED = {("028", "FR"): 30, ("011", "FR"): 27, ("002", "FR"): 53,
            ("028", "SC"): 8, ("011", "SC"): 8, ("002", "SC"): 7}
N_ITEMS = 2785
N_CLUSTERS = 255
ORIGIN = r"(?:028|011|002) (?:FR|SC)-\d{3}"
DISPOSITION = re.compile(
    r"^(ported|translated|dropped|merged-with (" + ORIGIN + r")|superseded-by (DV-\d{3})|deferred (2|3\+))$")
KEPT = ("ported", "translated", "merged-with")

errors = []
notes = []


def fail(check, message):
    errors.append("[%s] %s" % (check, message))


def read(path):
    if not os.path.isfile(path):
        print("missing input: %s" % path)
        sys.exit(2)
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def read_tsv(path, columns):
    text = read(path)
    rows = list(csv.reader(text.splitlines(), delimiter="\t", quoting=csv.QUOTE_NONE))
    if rows[0] != columns:
        fail("f", "%s: header is %s, expected %s" % (os.path.basename(path), rows[0], columns))
    out = []
    for number, row in enumerate(rows[1:], 2):
        if len(row) != len(columns):
            fail("f", "%s line %d: %d fields" % (os.path.basename(path), number, len(row)))
            continue
        out.append(dict(zip(columns, row)))
    return out


def kind(disposition):
    return disposition.split(" ")[0]


def register_rows(consolidation):
    """DV ids that open a table row inside section 6 of consolidation.md."""
    start = consolidation.find("## 6. Divergence register")
    body = consolidation[start:] if start >= 0 else ""
    return set(re.findall(r"(?m)^\| (DV-\d{3}) \|", body))


def roadmap_features(roadmap):
    return set(re.findall(r"(?m)^\| (1[234]\d-[a-z0-9-]+) \|", roadmap))


def check_row(check, key, row, dv_rows, road_features, roadmap, origins=None):
    disposition, feature = row["disposition"], row["feature"]
    match = DISPOSITION.match(disposition)
    if not match:
        fail("a" if origins is not None else "b", "%s: invalid disposition %r" % (key, disposition))
        return
    what = kind(disposition)
    if what == "merged-with" and origins is not None and match.group(2) not in origins:
        fail("a", "%s: merged-with names %s, which is not an as-is id" % (key, match.group(2)))
    if what == "merged-with" and origins is not None and match.group(2) == key:
        fail("a", "%s: merged with itself" % key)
    # c: destination
    if feature in WAVE1:
        if what == "deferred":
            fail("c", "%s: deferred to the Wave 1 feature %s" % (key, feature))
        if what == "dropped":
            fail("c", "%s: dropped rows have destination none, not %s" % (key, feature))
    elif feature in road_features:
        if what != "deferred":
            fail("c", "%s: %s goes to the later-wave feature %s" % (key, disposition, feature))
    elif feature == "roadmap":
        if what != "deferred":
            fail("c", "%s: destination roadmap with %s" % (key, disposition))
    elif feature == "none":
        if what != "dropped":
            fail("c", "%s: destination none with %s" % (key, disposition))
    else:
        fail("c", "%s: unknown destination %r" % (key, feature))
    if feature.split("-")[0] in UNUSED:
        fail("c", "%s: feature number %s is unused" % (key, feature))
    # d: register rows
    cited = set(re.findall(r"DV-\d{3}", disposition + " " + row["dv_or_roadmap"] + " " + row["proof"]))
    for dv in sorted(cited):
        if dv not in dv_rows:
            fail("d", "%s: cites %s, which is not a row of the divergence register" % (key, dv))
    # e: deferred rows
    if what == "deferred":
        entry = re.match(r"roadmap: (.+)$", row["dv_or_roadmap"])
        if not entry:
            fail("e", "%s: deferred without a roadmap entry" % key)
        elif entry.group(1) not in roadmap:
            fail("e", "%s: roadmap entry %r is not in roadmap.md" % (key, entry.group(1)))
        wave = match.group(4)
        number = feature.split("-")[0]
        if number.isdigit():
            expected = "2" if number in ("120", "121") else "3+"
            if wave != expected:
                fail("e", "%s: wave %s does not fit %s" % (key, wave, feature))
    # g: proof
    proof = row["proof"]
    if what in KEPT:
        if not re.search(r"FX-\d{2}.*PT-\d{3}-|CT-\d{3}-\d+", proof):
            fail("g", "%s: %s without a parity or characterization test (%r)" % (key, what, proof))
        for family in re.findall(r"FX-(\d{2})", proof):
            if not 1 <= int(family) <= 40:  # FX-38 to FX-40 were added by feature 141
                fail("g", "%s: unknown fixture family FX-%s" % (key, family))
        named = re.findall(r"(?:PT|CT)-(\d{3})-", proof)
        if named and feature[:3] not in named:
            fail("g", "%s: test %r does not belong to %s" % (key, proof, feature))
    elif what == "superseded-by":
        if match.group(3) not in row["dv_or_roadmap"]:
            fail("g", "%s: the register column does not name %s" % (key, match.group(3)))
    elif what == "dropped":
        if not re.search(r"justification", proof):
            fail("g", "%s: dropped without a written justification" % key)


def module_of(path):
    return re.sub(r"\.(py|sh|md|json|yml|yaml)$", "", path.split("/")[-1])


def inventory_clusters():
    """Recompute the clusters of R18 Appendix A from the inventory, when it is present."""
    path = P("research", "R18-behaviour-inventory.tsv")
    if not os.path.isfile(path):
        notes.append("inventory not found; clusters were not recomputed")
        return None
    with open(path, encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle, delimiter="\t", quoting=csv.QUOTE_NONE))
    ids, out = collections.OrderedDict(), {}
    for row in rows:
        key = (row["system"], module_of(row["evidence"].rsplit(":", 1)[0]), row["kind"])
        ids.setdefault(key, "C-%03d" % (len(ids) + 1))
        out[row["b_item"]] = (ids[key], row["system"])
    return out


def expand(ranges):
    items = []
    for part in ranges.split(","):
        part = part.strip()
        match = re.match(r"^B-(\d{4})(?:…B-(\d{4}))?$", part)
        if not match:
            return None
        first = int(match.group(1))
        last = int(match.group(2) or first)
        items.extend("B-%04d" % n for n in range(first, last + 1))
    return items


def check_markdown(text, frs, items):
    section2 = text[text.find("## 2. "):text.find("## 3. ")]
    section3 = text[text.find("## 3. "):text.find("## 4. ")]
    seen = {}
    for line in section2.splitlines():
        match = re.match(r"^\| (" + ORIGIN + r") \| .*? \| `([^`]+)` \| ([^|]+) \|", line)
        if match:
            if match.group(1) in seen:
                fail("f", "traceability.md: %s appears twice in section 2" % match.group(1))
            seen[match.group(1)] = (match.group(2), match.group(3).strip())
    for row in frs:
        got = seen.get(row["origin_id"])
        if got is None:
            fail("f", "traceability.md: %s is missing from section 2" % row["origin_id"])
        elif got != (row["disposition"], row["feature"]):
            fail("f", "traceability.md: %s differs from traceability-frs.tsv" % row["origin_id"])
    for origin in seen:
        if origin not in {r["origin_id"] for r in frs}:
            fail("f", "traceability.md: %s is not in traceability-frs.tsv" % origin)
    # g: the owner's approval on the rows of section 2 that are superseded or dropped
    for line in section2.splitlines():
        match = re.match(r"^\| (" + ORIGIN + r") \| .*? \| `([^`]+)` \| ", line)
        if match and kind(match.group(2)) in ("superseded-by", "dropped") and APPROVED not in line:
            fail("g", "traceability.md: %s is %s and does not say %r"
                 % (match.group(1), kind(match.group(2)), APPROVED))
    if re.search(r"(?i)needs the owner.s ruling|owner must rule", text):
        fail("g", "traceability.md: a row still asks for the owner's ruling")
    by_item = {r["b_id"]: r for r in items}
    covered = collections.Counter()
    clusters = set()
    count_rows = 0
    for line in section3.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
        if len(cells) != 11 or not re.match(r"^C-\d{3}(\.[a-z]+)?$", cells[0]):
            continue
        count_rows += 1
        cluster = cells[0][:5]
        clusters.add(cluster)
        listed = expand(cells[4])
        if listed is None:
            fail("f", "traceability.md: row %s has an unreadable item range" % cells[0])
            continue
        if len(listed) != int(cells[5]):
            fail("f", "traceability.md: row %s counts %s and lists %d" % (cells[0], cells[5], len(listed)))
        disposition = cells[7].strip("`")
        for b in listed:
            covered[b] += 1
            item = by_item.get(b)
            if item is None:
                fail("f", "traceability.md: row %s names %s, which is not an item" % (cells[0], b))
            elif (item["cluster"], item["disposition"], item["feature"]) != (cluster, disposition, cells[8]):
                fail("f", "traceability.md: row %s disagrees with traceability-items.tsv on %s" % (cells[0], b))
    for b in by_item:
        if covered[b] != 1:
            fail("f", "traceability.md: %s is covered by %d rows of section 3" % (b, covered[b]))
    if len(clusters) != N_CLUSTERS:
        fail("f", "traceability.md: section 3 has %d clusters, expected %d" % (len(clusters), N_CLUSTERS))
    check_counts(text, frs, items)
    return count_rows


def check_counts(text, frs, items):
    """Section 4.1 of traceability.md states the counts that the TSV files give."""
    start = text.find("### 4.1 ")
    table = text[start:text.find("### 4.2 ")] if start >= 0 else ""
    stated = {}
    for line in table.splitlines():
        match = re.match(r"^\| `([a-z-]+)` \| (\d+) \| (\d+) \| \d+ \| \d+ \| (\d+) \|", line)
        if match:
            stated[match.group(1)] = tuple(int(match.group(n)) for n in (2, 3, 4))
    for name in ("ported", "merged-with", "translated", "superseded-by", "deferred", "dropped"):
        counted = (sum(1 for r in frs if " FR-" in r["origin_id"] and kind(r["disposition"]) == name),
                   sum(1 for r in frs if " SC-" in r["origin_id"] and kind(r["disposition"]) == name),
                   sum(1 for r in items if kind(r["disposition"]) == name))
        if stated.get(name) != counted:
            fail("f", "traceability.md: section 4.1 states %s for %s, the TSV files give %s"
                 % (stated.get(name), name, counted))


REQ_ID = re.compile(r"\*\*(F(\d{3})-(?:FR|SC)-\d{3})\*\*")
FIELD = re.compile(r"^\s+[-*] (origin|disposition|test|divergence|ep|parity|status|assumption|proves|fixture):\s*(.*)$")
CITED = re.compile(r"(?<![A-Za-z0-9-])(" + ORIGIN + r"|C-\d{3}|B-\d{4})(?![0-9])")


FIXTURE = re.compile(r"FX-\d{2}")
TASK_LINE = re.compile(r"^-\s*\[[ xX]\]\s*(T[0-9]+)\b(.*)$")
TEST_NAME = re.compile(r"\b(?:PT|CT)-([0-9]{3})-[A-Za-z0-9-]+")
KEPT_START = ("ported", "translated", "merged-with")


def fixture_catalogue():
    """The fixture families of feature 141, when the specification tree is present.

    `contracts/fixture-catalogue.json` is generated from `spec.md` §O.2 and checked
    against it by `contracts/tools/generate.py --check`. The specification tree is a
    local tree and is not in every checkout, so its absence is a note and never a
    silent pass (F141-FR-034).
    """
    path = P("..", "..", "specs", "141-parity-oracle", "contracts", "fixture-catalogue.json")
    if not os.path.isfile(path):
        notes.append("the fixture catalogue of feature 141 is not in this checkout; "
                     "`fixture:` was not checked against it (check i)")
        return None
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
    return {f["id"]: f for f in data.get("families", [])}


def exercise_map():
    """The exercise map of feature 141, when one has been captured.

    F141-FR-034 asks for the claim check "where an exercise map exists": the map is
    written by the capture job of the oracle, which needs the two baselines, so a
    checkout without it is a note and never a silent pass.
    """
    path = P("..", "..", "packages", "oracle", "exercise-map", "exercise-map.json")
    if not os.path.isfile(path):
        notes.append("no exercise map has been captured; the claims were not checked "
                     "against it (check j, F141-FR-032)")
        return None
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def inventory_evidence():
    """`b_item` -> evidence line, from the inventory and from the supplement of 141."""
    out = {}
    path = P("research", "R18-behaviour-inventory.tsv")
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as handle:
            for row in csv.DictReader(handle, delimiter="\t", quoting=csv.QUOTE_NONE):
                out[row["b_item"]] = row["evidence"]
    supplement = P("..", "..", "packages", "oracle", "exercise-map", "supplement.tsv")
    if os.path.isfile(supplement):
        with open(supplement, encoding="utf-8") as handle:
            for row in csv.DictReader(handle, delimiter="\t", quoting=csv.QUOTE_NONE):
                out[row["b_item"]] = row["evidence"]
    return out


def read_declarations(root):
    """The declarations of §O.6 in one `tasks.md`: the test, its `proves:` and its `fixture:`.

    A task declares a test when it names one and carries `proves:` or `fixture:`
    under it. `read_proves` reads the ids alone; the claim check needs the ids and
    the fixtures of the SAME task, because a claim is an id and the fixtures beside it.
    """
    path = os.path.join(root, "tasks.md")
    if not os.path.isfile(path):
        return None
    out, task = [], None

    def flush():
        if not task or not (task["proves"] or task["fixture"]):
            return
        for name in task["names"]:
            out.append({"test": name, "feature": TEST_NAME.match(name).group(1),
                        "line": task["line"], "proves": task["proves"],
                        "fixture": task["fixture"]})

    with open(path, encoding="utf-8") as handle:
        for number, line in enumerate(handle, 1):
            opened = TASK_LINE.match(line)
            if opened:
                flush()
                task = {"line": number,
                        "names": [m.group(0) for m in TEST_NAME.finditer(opened.group(2) or "")],
                        "proves": [], "fixture": []}
                continue
            if task is None:
                continue
            field = FIELD.match(line)
            if field and field.group(1) == "proves":
                task["proves"].extend(CITED.findall(field.group(2)))
            elif field and field.group(1) == "fixture":
                task["fixture"].extend(FIXTURE.findall(field.group(2)))
            elif line.strip() and not line.startswith((" ", "\t")):
                flush()
                task = None
    flush()
    return out


def executed(mapping, scenario, evidence):
    """Did this scenario of the exercise map execute this `file:line` of the reference?"""
    path, _, number = evidence.rpartition(":")
    if not number.isdigit():
        return False
    number = int(number)
    for first, last in mapping.get("scenarios", {}).get(scenario, {}).get(path, []):
        if first <= number <= last:
            return True
    return False


def scenarios_of(mapping, families):
    """Every scenario of the map that a `fixture:` of these families stands for."""
    return sorted(s for s in mapping.get("scenarios", {})
                  if s.split("/")[0] in families)


def check_fixture_citations(feature, declarations, catalogue):
    """Check i (F141-FR-034): every `fixture:` names a family of the catalogue that is not retired."""
    for declaration in declarations:
        for family in sorted(set(declaration["fixture"])):
            entry = catalogue.get(family)
            if entry is None:
                fail("i", "%s: %s names the fixture family %s, which the catalogue of feature 141 "
                          "does not hold" % (feature, declaration["test"], family))
            elif entry.get("status") == "retired":
                fail("i", "%s: %s names the fixture family %s, which is retired and is cited by no "
                          "test" % (feature, declaration["test"], family))


def check_claims(mapping, items, evidence, declarations):
    """Check j (F141-FR-032): a test may claim an item only if a fixture it names executed its line.

    An item: one scenario of its `fixture:` executed the evidence line of the item.
    A cluster: every item of the cluster that the traceability files assign to the
    feature of the test with a kept disposition was executed by a fixture of some
    test of that feature that claims the cluster. A claim whose scenarios the map
    does not hold is neither a pass nor a failure: the map grows with the fixtures.
    """
    by_item = {row["b_id"]: row for row in items}
    clusters = collections.defaultdict(list)
    for row in items:
        clusters[row["cluster"]].append(row)
    together = collections.defaultdict(set)
    for declaration in declarations:
        for claim in declaration["proves"]:
            if claim in clusters:
                together[(declaration["feature"], claim)].update(
                    scenarios_of(mapping, set(declaration["fixture"])))
    checked = 0
    for declaration in declarations:
        for claim in sorted(set(declaration["proves"])):
            if claim in by_item:
                line = evidence.get(claim)
                if not line:
                    continue
                named = scenarios_of(mapping, set(declaration["fixture"]))
                if not named:
                    continue
                checked += 1
                if not any(executed(mapping, s, line) for s in named):
                    fail("j", "%s claims the item %s and no fixture it names executed the evidence "
                              "line %s of that item (named: %s)"
                         % (declaration["test"], claim, line, ", ".join(named)))
            elif claim in clusters:
                reached = together[(declaration["feature"], claim)]
                if not reached:
                    continue
                mine = [row for row in clusters[claim]
                        if row["feature"].split("-")[0] == declaration["feature"]
                        and kind(row["disposition"]) in KEPT_START]
                checked += 1
                missing = [row["b_id"] for row in mine
                           if evidence.get(row["b_id"])
                           and not any(executed(mapping, s, evidence[row["b_id"]]) for s in reached)]
                if missing:
                    fail("j", "%s claims the cluster %s and %d kept item(s) of feature %s in it were "
                              "executed by no fixture of a test of that feature that claims the "
                              "cluster: %s" % (declaration["test"], claim, len(missing),
                                               declaration["feature"], ", ".join(missing[:8])))
    notes.append("claim check: %d claim(s) decided against the exercise map" % checked)


def spec_files(feature):
    """spec.md and the annexes of one feature; tasks.md apart."""
    root = os.path.normpath(P("..", "..", "specs", feature))
    files = []
    if os.path.isfile(os.path.join(root, "spec.md")):
        files.append(os.path.join(root, "spec.md"))
    annexes = os.path.join(root, "annexes")
    if os.path.isdir(annexes):
        files.extend(os.path.join(annexes, n) for n in sorted(os.listdir(annexes)) if n.endswith(".md"))
    return root, files


def read_requirements(feature, files):
    """Requirements in the written form of STAGE-B-RULES.md section 4: id -> {field: [values]}."""
    found = collections.OrderedDict()
    for path in files:
        current = None
        with open(path, encoding="utf-8") as handle:
            for line in handle:
                opened = re.match(r"^\s*[-*] " + REQ_ID.pattern, line)
                if opened:
                    current = opened.group(1)
                    if current in found:
                        fail("h", "%s: %s is defined twice" % (feature, current))
                    if opened.group(2) != feature[:3]:
                        fail("h", "%s: %s carries another feature's number" % (feature, current))
                    found.setdefault(current, collections.defaultdict(list))
                    continue
                field = FIELD.match(line)
                if field and current:
                    found[current][field.group(1)].append(field.group(2).strip())
                elif line.strip() and not line.startswith((" ", "\t")):
                    current = None
    return found


def read_proves(root):
    path = os.path.join(root, "tasks.md")
    if not os.path.isfile(path):
        return None
    out = set()
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            field = FIELD.match(line)
            if field and field.group(1) == "proves":
                out.update(CITED.findall(field.group(2)))
    return out


def check_specs(frs, items, dv_rows, require_all=False):
    """Stage B: rows against the specs under specs/1nn-*/. Checks h1 to h4.

    h1  every row with a kept disposition resolves to a requirement of the spec of its destination
        feature that carries `origin:` with its id, its cluster or its B-item
    h2  every `origin:` citation names an id that exists and that the traceability files assign to
        that feature with a kept disposition; every `divergence:` names a register row
    h3  every row with a kept disposition is named by the `proves:` of a test task of its feature,
        and every id a test names exists
    h4  every `superseded-by` and `dropped` row names a register row that carries the owner's
        approval (dropped rows: a written justification, approved by ruling K8)
    A feature without spec.md is skipped with a note, unless --require-all is given.
    """
    known = {r["origin_id"] for r in frs} | {r["b_id"] for r in items} | {r["cluster"] for r in items}
    catalogue = fixture_catalogue()
    mapping = exercise_map()
    evidence = inventory_evidence()
    every_declaration = []
    checked = 0
    for feature in WAVE1:
        root, files = spec_files(feature)
        if not files:
            if require_all:
                fail("h", "%s: no spec.md" % feature)
            continue
        checked += 1
        reqs = read_requirements(feature, files)
        if not reqs:
            fail("h", "%s: no requirement in the written form of STAGE-B-RULES.md" % feature)
            continue
        my_frs = [r for r in frs if r["feature"] == feature]
        my_items = [r for r in items if r["feature"] == feature]
        kept_ids = {r["origin_id"] for r in my_frs if kind(r["disposition"]) in KEPT}
        kept_items = {r["b_id"]: r["cluster"] for r in my_items if kind(r["disposition"]) in KEPT}
        kept_clusters = set(kept_items.values())
        cited = set()
        for req, fields in reqs.items():
            here = set()
            for value in fields.get("origin", []):
                here.update(CITED.findall(value))
            for origin in sorted(here):
                if origin not in known:
                    fail("h2", "%s: cites %s, which does not exist" % (req, origin))
                elif origin not in kept_ids and origin not in kept_items and origin not in kept_clusters:
                    fail("h2", "%s: cites %s, which is not a kept row of %s" % (req, origin, feature))
            if here and not fields.get("disposition"):
                fail("h2", "%s: origin without disposition" % req)
            if here and not fields.get("test"):
                fail("h2", "%s: origin without test" % req)
            for value in fields.get("divergence", []):
                for dv in re.findall(r"DV-\d{3}", value):
                    if dv not in dv_rows:
                        fail("h2", "%s: cites %s, which is not a register row" % (req, dv))
                if "DV-new" in value:
                    fail("h2", "%s: still cites a register row to be written (%s)" % (req, value))
            cited |= here
        for origin in sorted(kept_ids - cited):
            fail("h1", "%s: %s has no requirement with this origin" % (feature, origin))
        open_clusters = collections.Counter(
            cluster for b, cluster in kept_items.items() if b not in cited and cluster not in cited)
        for cluster, count in sorted(open_clusters.items()):
            fail("h1", "%s: %d kept items of %s have no requirement with their origin" % (feature, count, cluster))
        declarations = read_declarations(root) or []
        every_declaration.extend(declarations)
        if catalogue is not None:
            check_fixture_citations(feature, declarations, catalogue)
        proves = read_proves(root)
        if proves is None:
            if require_all:
                fail("h3", "%s: no tasks.md" % feature)
            else:
                notes.append("%s: tasks.md not written yet; h3 skipped" % feature)
        else:
            for origin in sorted(proves - known):
                fail("h3", "%s: a test proves %s, which does not exist" % (feature, origin))
            for origin in sorted(kept_ids - proves):
                fail("h3", "%s: no test task proves %s" % (feature, origin))
            unproven = collections.Counter(
                cluster for b, cluster in kept_items.items() if b not in proves and cluster not in proves)
            for cluster, count in sorted(unproven.items()):
                fail("h3", "%s: no test task proves %d kept items of %s" % (feature, count, cluster))
    if mapping is not None:
        check_claims(mapping, items, evidence, every_declaration)
    consolidation = read(P("consolidation.md"))
    ruled = {}
    for line in consolidation[consolidation.find("## 6. Divergence register"):].splitlines():
        row = re.match(r"^\| (DV-\d{3}) \|", line)
        if row:
            ruled[row.group(1)] = line
    for row in list(frs) + list(items):
        key = row.get("origin_id") or row["b_id"]
        what = kind(row["disposition"])
        if what == "superseded-by":
            dv = row["disposition"].split(" ")[1]
            if dv not in ruled:
                fail("h4", "%s: %s is not a register row" % (key, dv))
        elif what == "dropped" and "justification" not in row["proof"]:
            fail("h4", "%s: dropped without a written justification" % key)
    skipped = len(WAVE1) - checked
    notes.append("Stage B check: %d of %d Wave 1 features have a spec%s"
                 % (checked, len(WAVE1), "" if not skipped else "; %d skipped" % skipped))


def main():
    consolidation = read(P("consolidation.md"))
    roadmap = read(P("roadmap.md"))
    architecture = read(P("architecture.md"))
    markdown = read(P("traceability.md"))
    frs = read_tsv(P("traceability-frs.tsv"),
                   ["origin_id", "system", "disposition", "feature", "proof", "dv_or_roadmap"])
    items = read_tsv(P("traceability-items.tsv"),
                     ["b_id", "cluster", "system", "disposition", "feature", "proof", "dv_or_roadmap"])
    dv_rows = register_rows(consolidation)
    road_features = roadmap_features(roadmap)
    if len(WAVE1) != N_WAVE1 or len(set(WAVE1)) != N_WAVE1:
        fail("c", "the list of Wave 1 features holds %d names, expected %d" % (len(set(WAVE1)), N_WAVE1))
    for feature in WAVE1:
        if "| %s |" % feature not in architecture:
            fail("c", "feature %s is not in architecture.md section 14" % feature)
        if feature in road_features:
            fail("c", "feature %s is a Wave 1 feature and is also a feature of roadmap.md" % feature)
    for feature in LATER:
        if feature not in road_features:
            fail("c", "later-wave feature %s is not in roadmap.md" % feature)
    for feature in sorted(road_features - set(LATER)):
        fail("c", "roadmap.md lists %s, which is not a known later-wave feature" % feature)
    # the register grows with each analyze run: its size is a fact of the register; the check keeps
    # the numbering free of gaps
    n_register = max(int(dv[3:]) for dv in dv_rows) if dv_rows else 0
    wanted_rows = set("DV-%03d" % n for n in range(1, n_register + 1))
    for dv in sorted(wanted_rows - dv_rows):
        fail("d", "the divergence register has no row %s" % dv)
    for dv in sorted(dv_rows - wanted_rows):
        fail("d", "the divergence register holds %s, beyond the %d rows expected" % (dv, n_register))

    # a
    origins = collections.Counter(r["origin_id"] for r in frs)
    expected = set()
    for (system, what), count in EXPECTED.items():
        expected.update("%s %s-%03d" % (system, what, n) for n in range(1, count + 1))
    for origin, count in origins.items():
        if count != 1:
            fail("a", "%s appears %d times" % (origin, count))
    for origin in sorted(expected - set(origins)):
        fail("a", "%s is missing" % origin)
    for origin in sorted(set(origins) - expected):
        fail("a", "%s is not an as-is id" % origin)
    for row in frs:
        if row["system"] != row["origin_id"][:3]:
            fail("a", "%s: system column is %s" % (row["origin_id"], row["system"]))
        check_row("a", row["origin_id"], row, dv_rows, road_features, roadmap, origins=expected)

    # b
    ids = collections.Counter(r["b_id"] for r in items)
    wanted = set("B-%04d" % n for n in range(1, N_ITEMS + 1))
    for b, count in ids.items():
        if count != 1:
            fail("b", "%s appears %d times" % (b, count))
    for b in sorted(wanted - set(ids)):
        fail("b", "%s is missing" % b)
    for b in sorted(set(ids) - wanted):
        fail("b", "%s is not an inventory item" % b)
    inventory = inventory_clusters()
    for row in items:
        if not re.match(r"^C-\d{3}$", row["cluster"]) or not 1 <= int(row["cluster"][2:]) <= N_CLUSTERS:
            fail("b", "%s: unknown cluster %r" % (row["b_id"], row["cluster"]))
        if inventory and inventory.get(row["b_id"]) != (row["cluster"], row["system"]):
            fail("b", "%s: cluster or system differs from the inventory" % row["b_id"])
        if kind(row["disposition"]) == "merged-with" and row["disposition"][12:] not in expected:
            fail("b", "%s: merged-with names an unknown id" % row["b_id"])
        check_row("b", row["b_id"], row, dv_rows, road_features, roadmap)
    if len(set(r["cluster"] for r in items)) != N_CLUSTERS:
        fail("b", "%d clusters in traceability-items.tsv, expected %d"
             % (len(set(r["cluster"] for r in items)), N_CLUSTERS))

    # f
    cluster_rows = check_markdown(markdown, frs, items)

    check_specs(frs, items, dv_rows, require_all="--require-all" in sys.argv[1:])

    # summary
    order = ["ported", "merged-with", "translated", "superseded-by", "deferred", "dropped"]
    fr_count = collections.Counter(kind(r["disposition"]) for r in frs if " FR-" in r["origin_id"])
    sc_count = collections.Counter(kind(r["disposition"]) for r in frs if " SC-" in r["origin_id"])
    item_count = collections.Counter(kind(r["disposition"]) for r in items)
    per_cluster = collections.defaultdict(set)
    for row in items:
        per_cluster[row["cluster"]].add(kind(row["disposition"]))
    cluster_count = collections.Counter(
        next(iter(v)) if len(v) == 1 else "split" for v in per_cluster.values())
    print("traceability check")
    print("  requirements %d, success criteria %d, clusters %d (%d rows), items %d"
          % (sum(fr_count.values()), sum(sc_count.values()), len(per_cluster), cluster_rows, len(items)))
    print("  %-15s %5s %5s %9s %7s" % ("disposition", "FRs", "SCs", "clusters", "items"))
    for name in order:
        print("  %-15s %5d %5d %9d %7d"
              % (name, fr_count[name], sc_count[name], cluster_count[name], item_count[name]))
    print("  %-15s %5s %5s %9d %7s" % ("split", "-", "-", cluster_count["split"], "-"))
    load = collections.Counter(r["feature"] for r in items)
    kept = collections.Counter(r["feature"] for r in items if kind(r["disposition"]) in KEPT)
    print("  items per destination (all / kept), heaviest first:")
    for feature, count in load.most_common():
        flag = "  <-- above 270 kept items" if kept[feature] > 270 else ""
        if feature in WAVE1[-5:]:
            flag += "  (added 2026-09-29)"
        print("    %-40s %5d %5d%s" % (feature, count, kept[feature], flag))
    cited = set()
    for row in frs + items:
        cited.update(re.findall(r"DV-\d{3}", row["disposition"] + " " + row["dv_or_roadmap"]))
    print("  register rows cited: %d of %d" % (len(cited), len(dv_rows)))
    for note in notes:
        print("  note: %s" % note)
    if errors:
        print("FAILED: %d error(s)" % len(errors))
        for line in errors[:200]:
            print("  " + line)
        if len(errors) > 200:
            print("  ... and %d more" % (len(errors) - 200))
        return 1
    print("PASSED: checks a to j")
    return 0


if __name__ == "__main__":
    sys.exit(main())
