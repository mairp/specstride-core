#!/usr/bin/env python3
"""Generator and check for the contracts of feature 123. A tool of the specification, not of the product.

Reads ../../spec.md (the reference sections R.5, R.6, R.7 and the closed sets) and
  * writes relaunch-observe.table.json and relaunch-root.table.json (the tables in the form of
    feature 100, annex X §X.3),
  * writes launch-checks.json and closed-sets.json,
  * with --check, writes nothing and fails when a file on disk differs from what the spec gives, when a
    row of a table has no predicate here, or when a literal is not in the closed set of refusals.

Standard library only. Run:  python3 generate.py [--check]
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CONTRACTS = os.path.normpath(os.path.join(HERE, ".."))
SPEC = os.path.normpath(os.path.join(HERE, "..", "..", "spec.md"))

# Predicates, in the operators of annex X §X.3: equal, notEqual, less, greater, memberOf, present, and, or, not.
T = lambda s: {"equal": [s, True]}
NOT = lambda p: {"not": p}
EQ = lambda s, v: {"equal": [s, v]}

PRED_1 = {
    "O-01": T("noRelaunch"),
    "O-02": NOT(T("terminal")),
    "O-03": T("stopRequested"),
    "O-04": EQ("status", "completed"),
    "O-05": EQ("status", "stopped"),
    "O-06": EQ("status", "unknown-terminal"),
    "O-07": EQ("status", "lock-conflict"),
    "O-08": NOT({"present": "launcherExit"}),
    "O-09": NOT({"less": ["launcherExit", 128]}),
    "O-10": EQ("launcherExit", 20),
    "O-11": EQ("launcherExit", 21),
    "O-12": EQ("launcherExit", 23),
    "O-13": EQ("launcherExit", 24),
    "O-14": {"notEqual": ["launcherExit", 22]},
    "O-15": {"notEqual": ["runState", "failed"]},
    "O-16": NOT(T("stageKnown")),
    "O-17": EQ("stageReasonClass", "postcondition"),
    "O-18": EQ("stageReasonClass", "stage-precondition"),
    "O-19": EQ("stageReasonClass", "setup-required"),
    "O-20": EQ("stageReasonClass", "interrupted"),
    "O-21": EQ("stageReasonClass", "existing-prerequisite"),
    "O-22": EQ("stageReasonClass", "completed"),
    "O-23": EQ("stageReasonClass", "exec-error"),
    "O-24": EQ("stageReasonClass", "other"),
    # O-33 and O-34 stand between O-24 and O-25 (F123-FR-042). O-33 is active under every profile
    # (CQ-238); O-34 is inactive under the parity profile (register row DV-114). The ids are the next
    # free ones: an id is never renumbered.
    "O-33": T("blocked"),
    "O-34": {"and": [NOT(T("parityProfile")), NOT(T("retryable"))]},
    "O-25": NOT(T("childExitListed")),
    "O-26": NOT(T("reasonAllowed")),
    "O-27": T("contractChanged"),
    "O-28": T("learningChanged"),
    "O-29": T("launcherEdited"),
    "O-30": NOT({"greater": ["budgetRemaining", 0]}),
    "O-31": T("deadlinePassed"),
    "O-32": None,
}

NOT_CRASH = {"notEqual": ["cause", "crash"]}
PRED_2 = {
    "R-01": T("stopRequested"),
    "R-02": T("interrupted"),
    "R-03": T("blocked"),
    "R-04": EQ("cause", "owner-lost"),
    "R-05": {"and": [EQ("exitCode", 6), EQ("cause", "normal")]},
    "R-06": EQ("stageReasonClass", "postcondition"),
    "R-07": EQ("stageReasonClass", "stage-precondition"),
    "R-08": EQ("stageReasonClass", "setup-required"),
    "R-09": EQ("stageReasonClass", "interrupted"),
    "R-10": EQ("stageReasonClass", "existing-prerequisite"),
    "R-11": EQ("stageReasonClass", "completed"),
    "R-12": EQ("stageReasonClass", "exec-error"),
    "R-13": EQ("stageReasonClass", "other"),
    "R-14": {"and": [NOT_CRASH, NOT(T("retryable"))]},
    "R-15": {"and": [NOT_CRASH, NOT(T("childExitListed"))]},
    "R-16": {"and": [NOT_CRASH, NOT(T("reasonAllowed"))]},
    "R-17": T("contractChanged"),
    "R-18": T("learningChanged"),
    "R-19": T("launcherEdited"),
    "R-20": NOT({"greater": ["budgetRemaining", 0]}),
    "R-21": T("deadlinePassed"),
    "R-22": T("held"),
    "R-23": EQ("cause", "crash"),
    "R-24": None,
}

SIGNALS_1 = {
    "noRelaunch": "boolean", "terminal": "boolean", "stopRequested": "boolean",
    "status": "text", "launcherExit": "whole number or null", "runState": "text",
    "stageKnown": "boolean", "stageReasonClass": "text",
    "blocked": "boolean", "retryable": "boolean", "parityProfile": "boolean",
    "childExitListed": "boolean",
    "reasonAllowed": "boolean", "contractChanged": "boolean", "learningChanged": "boolean",
    "launcherEdited": "boolean", "budgetRemaining": "whole number", "deadlinePassed": "boolean",
}
SIGNALS_2 = {
    "stopRequested": "boolean", "interrupted": "boolean", "blocked": "boolean", "cause": "text",
    "exitCode": "whole number", "retryable": "boolean", "stageReasonClass": "text",
    "childExitListed": "boolean", "reasonAllowed": "boolean", "contractChanged": "boolean",
    "learningChanged": "boolean", "launcherEdited": "boolean", "budgetRemaining": "whole number",
    "deadlinePassed": "boolean", "held": "boolean",
}


def read_spec():
    with open(SPEC, encoding="utf-8") as handle:
        return handle.read()


def rows_of(text, marker):
    """Rows `| X-nn | fires | literal | decision |` of the table that follows the marker line."""
    start = text.index(marker)
    end = text.index("\n\n", text.index("|---", start))
    out = []
    for line in text[start:end].splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
        if len(cells) == 4 and re.match(r"^[OR]-\d\d$", cells[0]):
            out.append({"ruleId": cells[0], "text": cells[1], "literal": re.match(r"`([^`]+)`", cells[2]).group(1), "decision": cells[3]})
    return out


def table(text, marker, tid, preds, signals):
    rows = rows_of(text, marker)
    out_rows = []
    for row in rows:
        if row["ruleId"] not in preds:
            raise SystemExit("no predicate for %s" % row["ruleId"])
        entry = {"ruleId": row["ruleId"], "choice": row["literal"], "decision": row["decision"]}
        if preds[row["ruleId"]] is not None:
            entry["when"] = preds[row["ruleId"]]
        out_rows.append(entry)
    if set(preds) != {r["ruleId"] for r in rows}:
        raise SystemExit("predicates and rows differ for %s" % tid)
    return {
        "schema": "specstride.table/1", "id": tid, "version": "1.0.0",
        "points": {"relaunch": {"signals": signals,
                                "choices": sorted({r["choice"] for r in out_rows})}},
        "rows": {"relaunch": out_rows},
    }


def launch_checks(text):
    start = text.index("### §R.5")
    end = text.index("### §R.6")
    checks = []
    for line in text[start:end].splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
        if len(cells) == 4 and re.match(r"^\d$", cells[0]):
            reasons = [r for r in re.findall(r"`([a-z-]+)`", cells[2]) if r != "validated"]
            checks.append({"order": int(cells[0]), "name": cells[1].strip("`"), "reasons": reasons,
                           "decision": cells[3].strip("`")})
    return {"schema": "specstride.launch-checks/1", "checks": checks,
            "lb": True, "note": "registered in the doctor registry with the launch-blocking flag (EP-14)"}


def closed_sets(text):
    t1 = rows_of(text, "**Table 1, `relaunch-observe`.**")
    t2 = rows_of(text, "**Table 2, `relaunch-root`.**")
    refusals = sorted({r["literal"] for r in t1 + t2 if r["decision"] != "relaunch"})
    approvals = sorted({r["literal"] for r in t1 + t2 if r["decision"] == "relaunch"})
    checks = launch_checks(text)["checks"]
    return {
        "schema": "specstride.closed-sets-123/1",
        "launchCheckRefusals": sorted({r for c in checks for r in c["reasons"]}),
        "relaunchRefusals": refusals,
        "relaunchApprovals": approvals,
        "resolveRefusals": ["launcher-missing", "launcher-not-found", "launcher-not-generated",
                            "launcher-ambiguous", "launcher-unreadable"],
        "holdRefusals": ["no-live-run"],
        "stageReasonsTransient": ["exit", "timeout", "recovery-deadline", "recovery-exhausted"],
        "stageReasonsDeliberate": ["postcondition", "stage-precondition", "setup-required", "interrupted",
                                   "existing-prerequisite", "completed", "exec-error:"],
        "digestStates": ["completed", "failed", "stopped", "dry-run"],
        "supervisionOutcomes": {"completed": 0, "stopped": 2, "unknown-terminal": 3, "refused": 4,
                                "supervision-expired": 5, "failed": 22, "lock-conflict": 24},
        "relaunchOwner": ["root", "supervise"],
        "runRequestKinds": ["pipeline", "engine"],
        "stageKinds": ["setup", "decision", "command", "specstride", "smoke"],
        "preconditionChecks": ["file_exists", "dir_exists", "env_set", "command_available",
                               "command_success", "json_field_equals"],
    }


def table_rows(text, marker, width):
    start = text.index(marker)
    end = text.index("\n\n", text.index("|---", start))
    rows = []
    for line in text[start:end].splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split(" | ")]
        if len(cells) == width and not cells[0].startswith(("---", "Line", "Verb")):
            rows.append(cells)
    return rows


def pipeline_lines(text):
    rows = table_rows(text, "| Line | When | Stream | Hue |", 4)
    return {"schema": "specstride.pipeline-lines/1", "mode": "compatibility",
            "lines": [{"line": r[0], "when": r[1], "stream": r[2], "hue": r[3]} for r in rows],
            "default": {"printed": ["[DIGEST]", "[WARN]", "[BLOCKED]", "[INVALID]", "[STALE]", "[ERROR]", "[FAIL]",
                                    "dry-run plan lines"],
                        "logOnly": ["[RUN]", "[PASS]", "[RECOVER]", "[RESUME]", "[READY]", "[SKIP] (live run)"]}}


def supervise_verbs(text):
    rows = table_rows(text, "| Verb | What it does | Exit |", 3)
    default = table_rows(text, "| Line | Keys | Printed |", 3)
    return {"schema": "specstride.supervise-verbs/1",
            "verbs": [{"verb": r[0], "does": r[1], "exit": r[2]} for r in rows],
            "defaultLines": [{"line": r[0], "keys": r[1], "printed": r[2]} for r in default],
            "limitsBytes": {"cycle": 420, "unchangedCycle": 0, "terminalDigest": 700, "run": 8400}}


def build():
    text = read_spec()
    return {
        "relaunch-observe.table.json": table(text, "**Table 1, `relaunch-observe`.**", "relaunch-observe", PRED_1, SIGNALS_1),
        "relaunch-root.table.json": table(text, "**Table 2, `relaunch-root`.**", "relaunch-root", PRED_2, SIGNALS_2),
        "launch-checks.json": launch_checks(text),
        "closed-sets.json": closed_sets(text),
        "pipeline-lines.json": pipeline_lines(text),
        "supervise-verbs.json": supervise_verbs(text),
    }


def main():
    check = "--check" in sys.argv
    problems = []
    files = build()
    for name, value in files.items():
        path = os.path.join(CONTRACTS, name)
        body = json.dumps(value, indent=1, sort_keys=False, ensure_ascii=False) + "\n"
        if check:
            if not os.path.isfile(path) or open(path, encoding="utf-8").read() != body:
                problems.append("%s differs from the spec" % name)
        else:
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(body)
    # checks that hold in both modes
    text = read_spec()
    sets = files["closed-sets.json"]
    literals = set(sets["relaunchRefusals"]) | set(sets["relaunchApprovals"])
    for literal in re.findall(r"`([a-z-]+(?:-<n>)?)`", text[text.index("Relaunch refusals and approvals (row 14)"):text.index("Resolve refusals (row 101)")]):
        if literal not in literals and literal not in ("classified-transient", "classified-crash"):
            problems.append("literal %s of the closed sets is in no row of the tables" % literal)
    for table_name in ("relaunch-observe.table.json", "relaunch-root.table.json"):
        rows = files[table_name]["rows"]["relaunch"]
        if rows[-1].get("when") is not None:
            problems.append("%s: the last row must have no predicate" % table_name)
        if len({r["ruleId"] for r in rows}) != len(rows):
            problems.append("%s: rule ids repeat" % table_name)
    # F123-FR-042: table 1 refuses a blocked run and a stop that is not retryable before O-25
    order = [r["ruleId"] for r in files["relaunch-observe.table.json"]["rows"]["relaunch"]]
    for rule in ("O-33", "O-34"):
        if rule not in order or not (order.index("O-24") < order.index(rule) < order.index("O-25")):
            problems.append("relaunch-observe: %s must stand between O-24 and O-25" % rule)
    for table_name, rule, literal in (("relaunch-observe.table.json", "O-33", "blocked-on-human"),
                                      ("relaunch-observe.table.json", "O-34", "stop-not-retryable"),
                                      ("relaunch-root.table.json", "R-03", "blocked-on-human"),
                                      ("relaunch-root.table.json", "R-14", "stop-not-retryable")):
        found = [r for r in files[table_name]["rows"]["relaunch"] if r["ruleId"] == rule]
        if not found or found[0]["choice"] != literal or found[0]["decision"] != "refuse":
            problems.append("%s: row %s must refuse with %s" % (table_name, rule, literal))
    # the labels that annex G §G.3 and feature 122 give to other commands are no lines of supervise
    taken = {"[SPECSTRIDE-LAUNCH]", "[SPECSTRIDE-STOP]", "[SPECSTRIDE-STATE]"}
    digest_keys = ["run", "comment", "changed", "delegated", "critic", "fallback", "alerts"]
    for line in files["supervise-verbs.json"]["defaultLines"]:
        label = line["line"].strip("`")
        if label in taken:
            problems.append("default output: the label %s belongs to another command" % label)
        if label == "[SPECSTRIDE-DIGEST]" and re.findall(r"`([a-z-]+)`", line["keys"]) != digest_keys:
            problems.append("default output: [SPECSTRIDE-DIGEST] must carry the keys of annex G §G.3")
    if len(sets["launchCheckRefusals"]) != 11:
        problems.append("launch-check refusals: %d, expected 11" % len(sets["launchCheckRefusals"]))
    for problem in problems:
        print("[contracts] " + problem)
    print("contracts of feature 123: %s" % ("FAIL" if problems else "ok"))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
