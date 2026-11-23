# Contracts of feature 125

This feature owns no extension point. It states data and tables that its own tests and the conformance suite
of EP-02 (feature 100, annex C §C.1) read.

| File | Content | Requirements |
|---|---|---|
| [argument-table.md](argument-table.md) | Exact flags, options and environment per role, profile and transport, with the version pin | F125-FR-009, F125-FR-012, F125-FR-023, F125-FR-028, F125-FR-035 |
| [classifier-table.md](classifier-table.md) | Claude's signals to quota classes, confidences and port failures; the usage fields | F125-FR-031, F125-FR-032, F125-FR-039 |
| [terms-rows.md](terms-rows.md) | The facts of the terms rows of Claude and of its SDK transport | F125-FR-005, F125-FR-037 |
| [transport-and-sdk.md](transport-and-sdk.md) | Transports, availability, the optional dependency, the pins | F125-FR-034 to F125-FR-038 |

The contracts of feature 100 that this feature uses are listed in `spec.md`, "Contracts of feature 100 used".
