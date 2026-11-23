# Data model: Terms gate

| Entity | Fields | Rules |
|---|---|---|
| Terms row | provider, auth tier, audience, status, source, access date, quoted sentence, verified-on | Status in the closed set; a missing field invalidates the file |
| Terms decision | provider, tier, audience, status, row reference, rule id, table version, warnings | Recorded with each evaluation |
| Acknowledgement | provider, tier, ack | User scope only; never lifts `refused` |

A terms data file is `shipped`, `replaced` (valid newer file in user-level state) or `ignored` (invalid).
