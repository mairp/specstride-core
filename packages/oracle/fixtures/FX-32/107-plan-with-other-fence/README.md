# FX-32/107-plan-with-other-fence

The plan holds a fence of another kind (`json`) before a shell block. The reading of
fences is the baseline's, line by line, its accident included (F107-FR-004): the closing
fence of the `json` block opens a plain block that runs to the next bare fence, so the
shell candidate the inventory records starts at the line after the `json` block and its
text carries the `## Verification` heading and the literal opening fence of the shell
block. The draft is still written with the open blocker `semantic-derivation-required`.
Added by feature 107 (spec.md §O.2, registered on 2026-09-30).
