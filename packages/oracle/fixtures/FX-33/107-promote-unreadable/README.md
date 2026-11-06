# FX-33/107-promote-unreadable

`contract validate --promote` names a file that is not JSON. The defect of the baseline is
preserved (F107-FR-021, Principle XVIII): a file that is not JSON counts as a status that is
not `draft`, so the baseline replaces it by a record whose only member is the status `draft`
and prints `status set back to draft: the contract does not pass strict validation` on
standard error. The exit code is 20 and `next:` hints name nothing, because the replaced
record carries no findings. Added by feature 107 (spec.md §O.2, registered on 2026-09-30).
