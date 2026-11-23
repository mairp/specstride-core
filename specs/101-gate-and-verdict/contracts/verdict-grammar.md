# Verdict grammar

## The demand in the critic prompt

The reply ends with exactly one line:

```text
VERDICT <nonce>: APPROVED
VERDICT <nonce>: REJECTED
```

`<nonce>` is 16 lower-case hexadecimal characters. The demand stands at the end of the prompt and
is repeated after the end marker (B-0973). The wording is the baseline's; the assembler of the
critic prompt places it.

## Parsing

| Rule | Content | Item |
|---|---|---|
| Line | A whole line: optional blanks, `VERDICT`, blanks, the nonce, optional blanks, a colon, optional blanks, `APPROVED` or `REJECTED`, optional blanks | B-0975 |
| Case | Not regarded; the word is read in upper case | B-0975, B-0979 |
| Place | Anywhere in the reply | B-0975 |
| Count | Exactly one matching line gives its verdict | B-0978 |

## MALFORMED

| Detail (closed set) | As-is text | Item |
|---|---|---|
| `nonce-mismatch` | `verdict line present but nonce missing/mismatched` | B-0976 |
| `no-verdict-line` | `no verdict line found` | B-0977 |
| `multiple-verdict-lines` | `multiple verdict lines (<n>)` | B-0978 |
| `call-failed` | The as-is text of a failed call of the transport, which the harness adapter gives | 002 FR-011 |

## What is never parsed

Phase evidence, grounded files, feedback, ledger records, rows of the fact block, results of inner
checks, the reply of the diagnostician.
