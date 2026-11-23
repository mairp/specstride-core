# Data model: Harness discovery (feature 146)

Records are described in words. Discovery writes no record. Its result is a list of candidates,
which becomes the field `harnesses` of the resolved registry (`specstride.registry/1`, feature
100, annex C §C.6).

## Candidate (becomes an entry of `harnesses`)

| Field | Meaning | Rule |
|---|---|---|
| `id` | Harness id | Unique in the resolved registry; precedence of F146-FR-011 |
| `sources` | Sources of discovery that found it | Members of the closed set "Sources of discovery" |
| `state` | `tested`, `locally-verified`, `declared`, `detected` | F146-FR-017 to F146-FR-019 |
| `origin` | Origin of the harness descriptor | Closed set 35 of feature 100 |
| `kind` | Kind of the harness descriptor | Open set |
| `version` | Version the probe read, or null | Step `version-help` |
| `descriptorHash` | Canonical record hash of the harness descriptor | The hasher of feature 100, annex X §X.5 |
| `resolvedPath` | Absolute path of the executable, or null | F100-FR-080 |
| `endpoint` | Scheme, host and path; never a user part, never a query | F146-FR-006 |
| `provider` | Identity: for an endpoint the host of the endpoint | Feature 100, annex X §X.9, threat T-14 |
| `capabilities` | Map; each value with provenance and ladder step, or null | F146-FR-013 |
| `window` | Tokens, source, and whether the margin was applied; or null | F146-FR-016 |
| `credential` | `yes`, `no`, `unprobed`; never a value | F146-FR-004 |
| `termsRef` | The value of `provider.termsRef` of the harness descriptor, or null where the terms are unknown; discovery ranks and picks nothing, and role resolution applies ruling P14 under every audience | Annex C §C.2; F146-FR-001 |
| `informational` | True for an entry of the source `host` | F146-FR-005; never a candidate for a role |
| `findings` | Probe failures, as doctor findings | F146-FR-014 |

## Result of harness verification (read only)

Written by the command of feature 109 at `user:harness-verify:<id>` as the record
`specstride.harness-verify/1`. This feature is the reader; the field list is the owner's
(feature 146, annex B §B.20) and feature 109 writes it with these names:

| Field | Meaning |
|---|---|
| `schema` | The constant `specstride.harness-verify/1`; required |
| `harness` | Harness id |
| `version` | Harness version at the verification, or null where the harness states none |
| `descriptorHash` | Hash of the harness descriptor at the verification, by the canonical hasher |
| `at` | Date of the verification run |
| `outcome` | `passed` or `failed` (annex X §X.6, row 131, owner 109); an unknown value is read as `failed` |
| `cases` | Per case of the suite: id and outcome |
| `budget` | The stated budget and what was used |

The schema file of this feature, `contracts/schemas/harness-verify-result.schema.json`, states the
field list; its `$id` is `urn:specstride:schema:specstride.harness-verify/1`.

## States of a harness

```text
(found by a source)  ──────────────►  detected
detected  ── the consumer writes or confirms the harness descriptor ──►  declared
declared | detected  ── a passed result of harness verification, same version and hash ──►  locally-verified
locally-verified  ── version or descriptor hash changes ──►  declared or detected (as before)
(shipped tested harness adapter)  ──►  tested          (no transition leads into or out of it)
```

## Validation rules

| Rule | Requirement |
|---|---|
| No value of a candidate is a secret value; a credential is `yes`, `no` or `unprobed` | F146-FR-004 |
| Every capability value has a provenance and a ladder step, or is null | F146-FR-013 |
| An endpoint holds scheme, host and path only | F146-FR-006 |
| An entry of the source `host` is marked informational | F146-FR-005 |
| A window is null or has a source; a window from the catalogue says that the margin was applied | F146-FR-016 |
| The state `tested` appears only with the origin `adapter` | F146-FR-019 |
