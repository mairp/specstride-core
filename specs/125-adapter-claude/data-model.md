# Data model: Claude harness adapter (feature 125)

| Entity | Fields | Rules |
|---|---|---|
| Descriptor | `descriptorVersion`, `id` (`claude`), `kind` (`cli`), `provider`, `auth.tiers`, `roles`, `invoke`, `stream.format`, `failures`, `cost`, `isolation`, `containment.ceiling`, `memory`, `telemetry.off`, `concurrentSessions`, `spendLimit`, `transports`, `tiers`, `versionRange`, `verifiedOn` | Data only; a value not established is null with no guess |
| Call | `role`, `transport`, `authTier`, `model`, `effort`, `permissionMode`, `containmentLevel`, `sessionDirective`, `customisation` (`off`), `argv` (list), `envNames` | Every field explicit; no default relied on |
| Session directive | `mode` (`fresh` or `continue`), `sessionId` | `fresh` carries a minted id; `continue` an existing id; an empty id is refused |
| Session record | `sessionId`, `attemptId`, `passIds`, `mintedBy` (`adapter`), `persisted`, `firstRequestAt`, `lastRequestAt` | Ends with the phase attempt. At auth tier 2 the state is in the throwaway home and goes with it; at auth tier 1 `persisted` is false and nothing is kept in the real home; the per-run set of proposer ids feeds the critic proof |
| Initial record (read) | `sessionId`, `tools`, `servers`, `plugins`, `model`, `capabilities` | Source of every proof |
| Proof | `outcome` (closed set of the spec), `toolsEmpty`, `serversEmpty`, `sessionMatches`, `sessionNotProposer` | Written to the call record of every critic-class call |
| Classifier entry | `signal`, `class`, `confidence`, `resetsAt`, `retryable`, `portFailure` | Pure; unknown signal is `provider_other` with confidence `text` |
| Usage increment | `sessionId`, `model`, `input`, `output`, `cacheRead`, `cacheCreate`, `costEstimate`, `notional`, `complete` | Null when unknown; never zero for an unknown |
| Terms row | `provider`, `authTier`, `audience`, `transport`, `status`, `source`, `accessDate`, `verifiedOn` | Supplied to the terms gate (feature 147) |
| Transport state | `transport`, `availability` (closed set), `reason`, `version` | Shown by the doctor |
| Ladder rung | `model`, `effort`, `order` | Lowest first; pinned at launch |

State transitions: a session goes `minted` to `running` to `ended`; its state never outlives its
phase attempt, and none is kept in the real configuration home. A transport goes `not-chosen`, or `available`, or one of the unavailable states; it
never changes during a run.
