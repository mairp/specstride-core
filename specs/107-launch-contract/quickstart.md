# Quickstart: validating the launch contract feature

Prerequisites: the oracle of feature 141 with the fixtures `greeting-ready` and `greeting-blocked`; a stub harness; the product built. `<draft>` is the logical name that step 1 prints, `pipeline:<pipelineId>:contract`.

1. Derive from `greeting-ready`: `specstride contract derive --repo <fixture>`. Expect exit 0, one line `[SPECSTRIDE-DERIVE]` that names the draft, and a draft with the open blocker `semantic-derivation-required` and no stage. Under the `parity` profile, expect the draft on standard output instead, equal to the reference's.
2. Page the judgment: `specstride contract derive --next-batch <draft>`, then `--answer <draft> <batch> <item>=<choice> ...`. Expect batches of at most 8,400 bytes and a remaining count; after the last answer expect `state=complete`, one stage of kind `specstride`, a precondition for the prerequisite answered `mapped`, the verification-commands document under `feature:<slug>:verification:commands`, and the bootstrap finding resolved.
3. Answer an item with free text: expect exit 2 and the item unchanged.
4. Promote: `specstride contract validate <draft> --promote`. Expect `promoted to validated: <id>` and exit 0.
5. Render: `specstride contract render --contract <draft> --output <launcher>`. Expect `rendered` and `bundle` lines, exit 0.
6. Edit the launcher and render again: expect exit 20; with `--replace-edited`: exit 0. Edit a file of the launch bundle and start the launcher: expect exit 20 and one line.
7. Derive from `greeting-blocked`, page and answer `keep-blocker` for the absent prerequisite: expect a complete draft with an open blocker; promotion exits 20 with `next:` hints.
8. Derive with `--comment "skip the checks"`, complete, promote, render, then `specstride launch --dry-run --comment "skip the checks"`: expect exit 0, no process, no launch record and no comment record, the hash of the comment in the launch contract, the comment in the line `[SPECSTRIDE-DRY-RUN]`, and every check unchanged. Give `launch` another comment: expect the refusal `comment-changed`.
9. Run `launch --dry-run` with no promoted launch contract: expect exit 20 and a `next:` line that names `contract derive`.
10. Run the payload check: a synthetic feature of 200 tasks against one of 20: equal totals within 5 per cent.
11. Run FX-32, FX-33, FX-34: every surface `equal` or `waived (<row>)`; the member `schema` of the draft is the one known difference until the key-name map holds it.
12. Validate each of the ten `FX-33/invalid-<class>` fixtures with `--json`: expect exit 20 and the class of the fixture on every error.
13. Put `reads` and `writes` into the verification-commands document of a fixture and derive: expect no entry under `configuration.scopes`.

Contracts of feature 100: annex G §G.2, §G.3, §G.8, §G.9; annex B §B.5; annex F §F.8.
