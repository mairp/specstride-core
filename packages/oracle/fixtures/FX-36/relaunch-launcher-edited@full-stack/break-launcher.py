#!/usr/bin/env python3
"""Edit a rendered launcher, with or without re-stamping the digest it carries.

Two refusals of the launch gate are about the launcher file itself, and they need
opposite things (`supervisor_lib.py:gate`, `render_launcher.py`):

  * `launcher-edited` needs a launcher whose `generated-content-sha256` no longer
    matches its body. Any edit does that: `edit`.
  * `launcher-syntax-error` needs a launcher that is INTACT by that digest and that
    `bash -n` still refuses, because the syntax check runs after the digest check.
    So the edit has to be followed by the renderer's own stamp, which is the sha-256
    of the body with the digest line put back to its placeholder
    (`render_launcher.py:normalized_launcher_digest`). That rule is copied here
    because the scenario is exactly about a launcher the digest check accepts.

Usage: break-launcher.py <launcher> (edit | syntax)
"""
import hashlib
import pathlib
import re
import sys

DIGEST_RE = re.compile(r"^(# generated-content-sha256: )[0-9a-f]{64}$", re.MULTILINE)
PLACEHOLDER = "__GENERATED_CONTENT_DIGEST__"
BROKEN = 'if then fi   # a line bash -n refuses\n'


def stamp(text):
    normalized = DIGEST_RE.sub(r"\1" + PLACEHOLDER, text, count=1)
    return hashlib.sha256(normalized.encode()).hexdigest()


def main() -> int:
    launcher = pathlib.Path(sys.argv[1])
    case = sys.argv[2]
    text = launcher.read_text(encoding="utf-8")
    if case == "edit":
        launcher.write_text(text + "# an operator edited this launcher\n", encoding="utf-8")
        return 0
    if case == "syntax":
        text = text + BROKEN
        digest = stamp(text)
        # A FUNCTION, never a template: a replacement string `r"\1" + digest` makes
        # `re.sub` read the first character of the digest as part of the group number
        # whenever it is a decimal digit, which is ten of the sixteen hexadecimal
        # characters. The digest is of a body that holds the absolute path of the
        # working directory, so which branch was taken differed in every run of the
        # same scenario: the launcher was re-stamped, left untouched, or stamped with
        # a mangled digest, and the gate answered launcher-syntax-error,
        # decision=launch or launcher-edited.
        text = DIGEST_RE.sub(lambda match: match.group(1) + digest, text, count=1)
        launcher.write_text(text, encoding="utf-8")
        return 0
    print("break-launcher: unknown case %s" % case, file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
