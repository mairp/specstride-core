# Contracts of feature 100

The machine-readable form of the annexes of `specs/100-specstride`. The other features read these
files beside the annexes. **Where a file here and an annex differ, the annex stands.**

## How the files are made

Every file outside `sources/` and `tools/` is generated from the tables of the annexes. Since
T207 the generator is the workspace tool `tools/contracts-gen/`:

```
npm run contracts:write   # write
npm run contracts:check   # compare with the annexes; exit 1 on a difference
```

The Python script `tools/generate.py` is the retired first generator. It stays in the tree as the
oracle of the port (`tools/contracts-gen/test/byte-identical.test.ts` runs both and asserts that
the 82 files are equal) and is no step of the build; Python 3 is no requirement of development.

Do not edit a generated file. Change the annex and generate again. The three files of `sources/`
are written by hand, since the annexes name no physical path; the generator checks them against
the annexes and the behaviour inventory.

The sync script of the `contracts` package (T008) clean-copies `data/` and `schemas/` of this
directory into the package. After the two clean copies it delivers the files that every other
feature lists in `specs/<feature>/contracts/deliver.json` (keys `data` and `schemas`, each a map
from the target name in the package to a path relative to that feature's `contracts/`), fails
when a target name already exists or two features name the same target, and verifies each
delivered file byte for byte. A file that another feature delivers through its
`contracts/deliver.json` is a data file of the package too; its target name carries the number of
that feature (`closed-sets-116.json`). The files of this directory stay generated, and the sync is
the one writer of the package directories.

## Files, and the annex section each one mirrors

### Record schemas (`schemas/`, JSON Schema 2020-12)

Each property carries the meaning, the type in words and the "required" cell of the annex
(`description`, `x-type-in-words`, `x-required`). `x-unknown-field` and `x-different-major` state
the two common rules.

| File | Schema id | Mirrors |
|---|---|---|
| `schemas/workspace-record.schema.json` | `specstride.layout/1` | Annex B §B.6 |
| `schemas/launch-record.schema.json` | `specstride.launch/1` | Annex B §B.7 |
| `schemas/lease.schema.json` | `specstride.lease/1` | Annex B §B.8 |
| `schemas/owner-record.schema.json` | part of `specstride.lease/1` | Annex B §B.9 |
| `schemas/process-registry.schema.json` | `specstride.procs/1` | Annex B §B.10 |
| `schemas/inbox-request.schema.json` | `specstride.inbox/1` | Annex B §B.11 |
| `schemas/run-snapshot.schema.json` | `specstride.snapshot/1` | Annex B §B.12 |
| `schemas/ledger-record.schema.json` | `specstride.ledger/1` | Annex B §B.13 |
| `schemas/approval-record.schema.json` | `specstride.approval/1` | Annex B §B.14 |
| `schemas/terminal-record.schema.json` | `specstride.terminal/1` | Annex B §B.15 |
| `schemas/supervision-record.schema.json` | `specstride.supervision/1` | Annex B §B.16 |
| `schemas/pause-record.schema.json` | `specstride.pause/1` | Annex B §B.17 |
| `schemas/tripwire-record.schema.json` | `specstride.tripwire/1` | Annex B §B.18 |
| `schemas/harness-descriptor.schema.json` | `descriptorVersion: 1` | Annex C §C.2 |
| `schemas/withheld-paths.schema.json` | `specstride.withheld-paths/1` | Annex C §C.4 |
| `schemas/stream-dialect-row.schema.json` | `specstride.stream-dialect/1` | Annex C §C.5 |
| `schemas/resolved-registry.schema.json` | `specstride.registry/1` | Annex C §C.6 |
| `schemas/canonical-spec-model.schema.json` | part of `specstride.spec-format/1` | Annex C §C.7 |
| `schemas/overlay.schema.json` | `specstride-overlay/v1` | Annex C §C.16 |
| `schemas/parallel-plan.schema.json` | `specstride.parallel-plan/1` | Annex D §D.3 |
| `schemas/yield-artifact.schema.json` | `specstride-pass-yield/v1` | Annex D §D.6 |
| `schemas/fact-block.schema.json` | `specstride.fact-block/1` | Annex D §D.7 |
| `schemas/check-manifest.schema.json` | `specstride.manifest/1` | Annex D §D.8 |
| `schemas/run-record.schema.json` | `specstride.run-state/1` | Annex E §E.2, "Run record" |
| `schemas/doctor-findings.schema.json` | `specstride.doctor/1` | Annex G §G.7 |
| `schemas/launch-contract.schema.json` | `specstride.launch-contract/1` | Annex G §G.8 |
| `schemas/event-envelope.schema.json` | `specstride.event/1` | Annex X §X.1 |
| `schemas/config-envelope.schema.json` | `specstride.config/1` | Annex X §X.2 |
| `schemas/rule-table.schema.json` | `specstride.table/1` | Annex X §X.3 |
| `schemas/redaction-pattern-set.schema.json` | `specstride.redaction/1` | Annex X §X.4 |

### Extension points (`extension-points/`)

One file per point: ids, annex section, operations, the requirements that cite the point, and the
thirteen sub-sections of the annex, word for word.

| File | Id | Mirrors |
|---|---|---|
| `extension-points/EP-01.host.json` | `specstride.host/1` | Annex H §H.1 |
| `extension-points/EP-02.harness.json` | `specstride.harness/1` | Annex C §C.1 |
| `extension-points/EP-03.spec-format.json` | `specstride.spec-format/1` | Annex C §C.7 |
| `extension-points/EP-04.loop-layer.json` | `specstride.loop-layer/1` | Annex D §D.1 |
| `extension-points/EP-05.check-runner.json` | `specstride.check-runner/1` | Annex C §C.8 |
| `extension-points/EP-06.router-rules.json` | `specstride.router-rules/1` | Annex D §D.4 |
| `extension-points/EP-07.verification-source.json` | `specstride.verification-source/1` | Annex C §C.9 |
| `extension-points/EP-08.event-sink.json` | `specstride.event-sink/1` | Annex C §C.10 |
| `extension-points/EP-09.view.json` | `specstride.view/1` | Annex G §G.6 |
| `extension-points/EP-10.secret-resolver.json` | `specstride.secret-resolver/1` | Annex C §C.11 |
| `extension-points/EP-11.terms.json` | `specstride.terms/1` | Annex C §C.12 |
| `extension-points/EP-12.quota-classifier.json` | `specstride.quota-classifier/1` | Annex C §C.13 |
| `extension-points/EP-13.lock.json` | `specstride.lock/1` | Annex F §F.5 |
| `extension-points/EP-14.doctor.json` | `specstride.doctor/1` | Annex G §G.7 |
| `extension-points/EP-15.prompt-block.json` | `specstride.prompt-block/1` | Annex D §D.5 |
| `extension-points/EP-16.toolchain.json` | `specstride.toolchain/1` | Annex C §C.14 |
| `extension-points/EP-17.detach.json` | `specstride.detach/1` | Annex F §F.6 |
| `extension-points/EP-18.critic-strategy-and-attempt-planner.json` | `specstride.critic-strategy/1`, `specstride.attempt-planner/1` | Annex E §E.1 |
| `extension-points/EP-19.stage-kind.json` | `specstride.stage-kind/1` | Annex F §F.7 |
| `extension-points/index.json` | — | Annex A §A.4 |

### Data (`data/`)

| File | Schema id | Mirrors |
|---|---|---|
| `data/layers.json` | — | Annex A §A.1, §A.4 |
| `data/package-graph.json` | — | Annex A §A.2, §A.3; from `sources/package-graph.json` |
| `data/layout.json` | `specstride.layout/1` | Annex B §B.1, §B.5, with the physical paths of `sources/physical-paths.json` |
| `data/identifiers.json` | — | Annex B §B.3 |
| `data/further-schema-ids.json` | twenty-one schema ids whose fields are with their owners | Annex B §B.20 |
| `data/presenter-interface.json` | `specstride.presenter/1` | Annex G §G.10 |
| `data/harness-tables.json` | part of `specstride.harness/1` | Annex C §C.3, §C.6, §C.15 |
| `data/loop-layer-tables.json` | `specstride.loop-layer/1`, `specstride.tree-store/1`, `specstride.router-rules/1` | Annex D §D.1, §D.2, §D.4 |
| `data/run-state-machine.json` | `specstride.run-state/1` | Annex E §E.2 |
| `data/stop-reasons.json` | `specstride.stop-reason/1` | Annex E §E.3 |
| `data/exit-codes.json` | — | Annex E §E.4; annex F §F.3, §F.8; annex G §G.4 |
| `data/process-model.json` | — | Annex F §F.1, §F.2, §F.4 |
| `data/cli-protocol.json` | protocol integer 1; `specstride.judgment/1` | Annex G §G.1, §G.2, §G.5, §G.9 |
| `data/line-grammar.json` | — | Annex G §G.3 |
| `data/host-capabilities.json` | part of `specstride.host/1` | Annex H §H.1 |
| `data/config-ranks.json` | `specstride.config/1` | Annex X §X.2 |
| `data/kernel-operations.json` | `specstride.redaction/1`; the canonical hasher | Annex X §X.4, §X.5 |
| `data/closed-sets.json` | — | Annex X §X.6 |
| `data/parity-profile.json` | `specstride.profile/1` | Annex X §X.7. The field `keys` of a row lists the configuration keys of the row and nothing else: a short form of the annex is written in full, a flag or a verb is left out, and a row without a key has an empty list and `key` null. The cell of the annex is in `keyNote` |
| `data/normalization.json` | `specstride.oracle-normalization/1` | Annex X §X.8 |
| `data/layout-old-side.json` | `specstride.oracle-normalization/1` | Annex X §X.8, old side, complete: one row per `file` item of the behaviour inventory (199), from `sources/old-side.json` |
| `data/threat-model.json` | — | Annex X §X.9 |

### Mirrors of everything

| File | Mirrors |
|---|---|
| `annex-tables/<annex>.json` (nine files) | Every table of the annex, by section and sub-heading |
| `requirements.json` | Every requirement F100-FR-001 to F100-FR-237 with its fields |

### Hand-written sources

| File | Content | Checked against |
|---|---|---|
| `sources/physical-paths.json` | The physical path behind every logical name; the roots | Annex B §B.5: every name has a path and no path is without a name |
| `sources/old-side.json` | The logical name or the rule for every `file` item of the inventory | The inventory (all 199 items), the traceability items, annex B §B.5 |
| `sources/package-graph.json` | Packages, layers, permitted imports | Read by the import-boundary check |

## The `$id` of a schema file

Every schema file of the product, in this feature and in every other, carries

```
"$id": "urn:specstride:schema:<schema id>"
```

where `<schema id>` is the id as the annexes write it, with its version: for example
`urn:specstride:schema:specstride.launch/1`, and `urn:specstride:schema:specstride-overlay/v1`
for an id that keeps its as-is name. A schema of a part of a record appends the part after a
colon, as the generator does (`urn:specstride:schema:specstride.lease/1:owner`). A schema file
that a feature needs for its own plan and that has no id in annex B, C, D, E, G or X is not a
contract; it takes the form `urn:specstride:schema:internal:<feature number>:<name>/<major>`, and no
other feature may read it. The bare schema id, an id only in `title`, and any other prefix are not
used. The value of the field `schema` inside a record is the schema id itself, with its version
(annex B §B.4), not the URN.

## Schema ids without a record schema

Three ids name a service or a list and have a data file, not a record schema:
`specstride.tree-store/1` (operations in `data/loop-layer-tables.json`), `specstride.stop-reason/1`
and `specstride.profile/1`. The schema files that the product validates against at run time are
built from these files by the tasks of this feature; they live in the `contracts` package.
