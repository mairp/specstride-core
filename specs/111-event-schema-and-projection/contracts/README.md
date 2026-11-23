# Contracts of feature 111

One data file, read by the build and checked against `spec.md`.

| File | Content |
|---|---|
| `event-catalogue.tsv` | One row per event type (122): kind (`open`, `close`, `instant`), partner, `data` fields, and the free-text fields of the type, each as `field:class` with its ingress class |

Checks: every partner of a pair is a type; every type of the catalogue is written in `spec.md`; every marked field is a field of its type; no `data` field is named `cause`, which is a field of the envelope.
