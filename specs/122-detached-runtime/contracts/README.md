# Contracts of feature 122

The interface contracts of this feature are owned by feature 100 (`specs/100-specstride/`):
EP-13 and EP-17 (annex F §F.5, §F.6), the launch record, the lease, the owner record, the process
registry and the inbox request (annex B §B.7 to §B.11). This directory holds only what feature
122 adds as data of its plan. Where a file here and `spec.md` differ, `spec.md` stands.

| File | Content | Requirements |
|---|---|---|
| `closed-sets.json` | The closed sets that feature 122 owns, with members and the rule for an unknown value | Spec, "Closed sets" |
| `parity-rows.json` | The options of the feature with their value under the `parity` profile, each with its row of annex X §X.7 (41, 113 to 116) | Spec, "Rows of the `parity` profile" |
| `probe-decision-table.json` | From the observations of a probe to its result | F122-FR-013 |
| `spike-cases.json` | The sixteen cases of the spike and the form of a result | F122-FR-040 |
| `state-archive.schema.json` | The form of the archive of `state export`, schema id `specstride.state-archive/1` (feature 100, annex B §B.20) | F122-FR-033, F122-FR-034 |
| `cli-state-commands.md` | Arguments, lines and exit codes of the three state commands and of the refusals of `launch` that this feature writes | F122-FR-005, F122-FR-033 to F122-FR-037; the lines follow annex G §G.3 |
