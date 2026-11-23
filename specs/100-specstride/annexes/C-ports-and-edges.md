# Annex C — Ports and edges (L1 and L2)

Part of the specification of feature `100-specstride`. Normative.

This annex holds the interfaces of nine extension points (EP-02, EP-03, EP-05, EP-07, EP-08, EP-10,
EP-11, EP-12, EP-16) and the interface contracts that travel with them: the harness descriptor, the
two forms of the `completion` level, the withheld paths, the stream dialect table, the resolved
registry and role plan, the canonical spec model, the containment levels and the overlay schema.
Interfaces are described in words and as field lists. The common rules of annex A §A.4 hold for
every point.

How to cite: "annex C, §C.3 Forms of the completion level, F100-FR-087".

## §C.1 EP-02 Harness port

#### Id and version
`specstride.harness/1`. The harness descriptor has its own version field, `descriptorVersion: 1` (§C.2).

#### Purpose
To let the engine run a proposer pass or a critic-class call on any harness without knowing which
harness it is. A harness is an agent CLI, an SDK or a model endpoint.

#### Caller and time
The CLI calls `detect`, `capabilities` and `preflight` at discovery, at launch and in the doctor.
The pass loop calls `startPass`, `stop` and `betweenPasses`. The critic strategy calls `complete`.
Every caller hands failures to `classify`. Role resolution runs at launch only.

#### Inputs
| Operation | Inputs |
|---|---|
| `detect` | Nothing beyond the descriptor |
| `capabilities` | Nothing beyond the descriptor and the detection result |
| `preflight` | The role |
| `startPass` | Reference to the prompt; working directory; session directive (`fresh`, with a minted id where the harness takes one from the caller, or `continue` with an id); model; model tier or effort; containment level; write root; environment allow-list; time limits; trace parent; transport; process-level spending limit where the harness adapter declares that capability |
| `complete` | Prompt; model; output cap; budget cap; form of the `completion` level; for the tool-less form an empty working directory; for the form with read-only tools the working tree and the withheld paths of §C.4; the minted session id |
| `stop` | The handle of a pass and one of `polite`, `terminate`, `kill` |
| `betweenPasses` | The handle of the pass that ended, its result, the working directory |
| `classify` | What the harness adapter saw: a stream record, a status with headers and body code, an exit code, error text |

#### Outputs
| Operation | Outputs |
|---|---|
| `detect` | Presence, version, whether a configuration home exists |
| `capabilities` | A map of capabilities. Every entry carries its provenance (`declared`, `probed`, `adapter`, `catalogue`) or is null: containment ceiling, continuation, model-tier ladder, usage source, switch for harness-native memory, tool-less mode, read-only critic mode, context window, `concurrentSessions`, process-level spending limit, transports |
| `preflight` | Whether the credential of the role is present and not refused; never a paid call |
| `startPass` | A handle with the identity of the process, the raw stream and the session id |
| `complete` | The reply, usage, and the facts of the initial record: tool list, session id, sandbox mode, network state |
| `stop` | Whether the process ended |
| `betweenPasses` | One of the closed set: `continue`; `stop` with the result 4; `stop` with the result 7 |
| `classify` | A typed failure from the closed vocabulary under "Errors", which the quota classifier (§C.13) refines |

#### Errors
Closed vocabulary: `authentication_failed`, `rate_limited`, `quota_exhausted`,
`context_window_exceeded`, `transport_failed`, `agent_failure`, `capability_absent`, and
`critic_not_toolless`. The last is a critic configuration error that halts the run (engine exit 3,
stop reason `critic_config`).

#### Guarantees of the core
The core sees only the port and never tests a harness name. There is one resolved registry per
launch, stored with the provenance of each value. The proposer comes from a flag, the environment,
configuration or the shipped default only; discovery never changes it. The environment of every
call is an allow-list. Every critic-class call is a fresh session. A call of a harness is refused
unless the terms gate allows it at that moment.

#### Guarantees of an implementation
A harness adapter passes secrets by environment or standard input and never in an argument list;
starts every process in a process group of its own; switches the harness's own telemetry off where
the descriptor names the switch; never writes the consumer's real configuration home, except the
installs of §C.1 "Wave 1 implementations" that the consumer listed; states the permission mode on
every call; reports unknown values as null and never guesses.

#### Failure of an implementation
A failure of `detect` or `capabilities` makes the harness absent from the registry, with a doctor
finding. A failure of `preflight` for a role in use refuses the launch. A failure of `startPass`
counts as a pass that ended with an error, by the existing breakers. A failure of `complete`
produces no verdict; it is scored as the baseline scores a transport error of the critic. A failure
of `betweenPasses` is `continue`. A failure of `classify` yields `agent_failure`.

#### Unknown-value rule
`kind`, `stream.format` and the role are open sets, resolved through registries. An unknown
top-level key of a descriptor refuses the descriptor; an unknown key under `x-` is ignored. An
unknown capability is null. An unknown failure is `agent_failure`. Auth tier 3 is not a valid value.

#### Wave 1 implementations
The harness adapters for Claude (on two transports: the CLI subprocess, and an SDK in process as an
optional transport with API keys only), dsh, Codex, pi and prime; the generic descriptor-driven
harness adapter for the kinds `cli`, `openai-chat` and `anthropic-messages`. A harness the consumer
declares by descriptor runs on the generic harness adapter. The one permitted write to a real
configuration home is a plugin install of a harness, only for plugins the consumer named in an
allowlist in user configuration, each recorded.

#### Content owner
109 (registry, port, generic harness adapter, conformance suite, sample). Sub-point stream readers:
126. Sub-point role resolution: 124. The harness adapters are implemented by 125, 130, 131, 134, 138.

#### Proving test
The conformance suite of harness adapters: a fake executable and a fake endpoint assert argument
list, standard input, environment and clean-up; recorded streams are replayed through the reader.
The descriptor-only sample: a descriptor for a fake CLI and one for a fake endpoint, both in the
test tree, complete a run as proposer and as critic, are shown by the doctor as unverified, and the
endpoint is picked as the diverse critic when none is configured, with no product file changed.

- **F100-FR-076**: The harness port MUST offer the eight operations `detect`, `capabilities`, `preflight`, `startPass`, `complete`, `stop`, `betweenPasses` and `classify`, with the inputs, outputs and errors of §C.1. It MUST have two capability levels: `proposer` (the harness ends by itself; takes the prompt by standard input, file or bounded argument; works in a given directory without asking; has a declared way to suppress prompts; gives an exit code; lets its credential be checked without a paid call) and `completion` (one prompt in, one reply out; no tools, by construction or by a declared and verified mechanism, or the second form of §C.3; a known context window with its source; a fresh session per call; typed failures; identity of provider and model).
  - test: CT-100-176
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-077**: Every capability value MUST carry its provenance, one of `declared`, `probed`, `adapter`, `catalogue`, or MUST be null. A capability that no run has shown MUST be reported as `unverified`. Where a declared and an effective context window differ, the smaller MUST be used.
  - test: CT-100-177
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-078**: The proposer MUST come from a flag, the environment, configuration or the shipped default only. When the proposer is absent the launch MUST be refused and the refusal MUST name the discovered candidates. Discovery MUST never change the proposer.
  - test: CT-100-178
  - ep: EP-02 `specstride.harness/1` (implements)
  - divergence: DV-004
  - parity: every fixture names the proposer and the critic (row 36 of annex X §X.7)

- **F100-FR-079**: The environment of every harness call MUST be an allow-list: the search path, the locale, the home or its overlay, the harness's own auth variables and what the descriptor names. A harness MUST NOT inherit the consumer's other provider keys. The credentials of the critic MUST never be in the environment of the proposer, and the reverse.
  - test: CT-100-179
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-080**: A harness executable MUST be resolved to an absolute path at launch and recorded with its version. An executable inside the workspace or in a directory that everyone may write MUST be refused. A path that changed since the last run MUST give a warning.
  - test: CT-100-180
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-081**: A transport MUST be a property of a harness adapter. One harness adapter MAY offer several, from the closed set `subprocess`, `sdk-in-process`, `direct-call`, each with its own auth tier and its own row of terms-gate data. A transport whose optional dependency is absent MUST be unavailable, with a doctor line, and MUST leave the other transports untouched. A transport other than the default MUST be chosen by the consumer in user configuration, the environment or a flag, and never automatically.
  - parity: `subprocess` for every harness; the critic of each harness in its as-is transport and mode (rows 27, 28 of annex X §X.7)
  - divergence: DV-001
  - test: CT-100-181
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-082**: Harness-native memory MUST be off for every critic-class call and off by default for the proposer, with an opt-in in user configuration. The setting MUST be recorded per run. A harness that cannot switch its memory off MUST NOT qualify as a critic.
  - divergence: DV-047
  - parity: no flag about memory is passed, as at the baseline (row 29 of annex X §X.7)
  - test: CT-100-182
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-083**: A new phase attempt, a critic-class call, a relaunch, a kill by a watchdog, the second repair of a unit, an escalation, a change of configuration and the first pass of the main line after a parallel group was applied MUST each start a fresh session. Inside a phase attempt a session MAY be continued where the harness adapter declares continuation, under the drop rules of the content owner. A harness that cannot continue a session carries context through files.
  - divergence: DV-010
  - parity: off (no invocation carries a continuation argument) (row 10 of annex X §X.7)
  - test: CT-100-183
  - ep: EP-02 `specstride.harness/1` (implements)

## §C.2 Harness descriptor, version 1

The descriptor is data. It lets the generic harness adapter drive a harness. A tested
harness adapter is a descriptor plus optional code, with a version range and a `verified-on` date.

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `descriptorVersion` | Version of the descriptor schema | Whole number; 1 | Yes |
| `id` | Id of the harness, unique in the resolved registry | Lower-case text with digits and hyphens | Yes |
| `displayName` | Name for people | Text | No |
| `kind` | `cli`, `openai-chat`, `anthropic-messages`, or another registered kind | Member of an open set | Yes |
| `provider.id` | Identity used for the diversity test and for the terms lookup | Text | Yes |
| `provider.termsRef` | Row of the terms-gate data, or null for unknown terms | Text, or null | Yes |
| `origin` | Set by the loader: `adapter`, `bundled`, `user`, `detected` | Member of a closed set | Set by the loader |
| `detect` | How presence is established free of charge: variables whose presence counts; for `cli` the executable, how to read its version, which help text must be present, the configuration home | Record | Yes |
| `auth.tiers` | Auth tiers offered: 1, 2 or both. 3 is never valid | List of whole numbers | Yes |
| `auth.credential` | Secret reference, or null when the harness owns its login | Secret reference, or null | Yes |
| `auth.scheme` | `bearer`, `x-api-key`, `none` | Member of a closed set | For endpoint kinds |
| `auth.preflight` | A free read-only request and the statuses that mean an auth failure; redirects refused | Record, or `none` | No |
| `endpoint` | Base address, path of the chat call, path of the model list | Record | For endpoint kinds |
| `models` | Default model; whether the list is probed or declared; the context window with its source; the output cap with its source; how a model is selected | Record | Yes |
| `roles` | Per role: whether supported, with the reason if not; for a critic: `toolless` (`structural`, `flag`, `config`, `none`), `readOnlyTools` (supported or not), `freshSession` | Map from role to record | Yes |
| `invoke` | Per role, for `cli`: argument list as a list, how the prompt is given and its size limit, working directory, environment, permission mechanism, files to write before the call | Map from role to record | For `cli` |
| `stream.format` | `text`, `jsonl`, `sse-openai`, `sse-anthropic`, or a registered tested format | Member of an open set | Yes |
| `stream.tolerate` | Irregularities to accept | List of text | No |
| `stream.usage` | Where input, output and cache tokens are found | Record of field paths | No |
| `stream.mapping` | A data mapping from the harness's records to the six normalized records of §C.5: selector of the record kind and field paths | Record | No |
| `stream.dialect` | Name of a row of the dialect table of §C.5 | Text | No |
| `continuation` | Whether supported, how an id is given, and `cacheTtlSec`, the cache lifetime of a session in seconds (300 where none is declared) | Record | Yes |
| `session` | Where session state lives and how it is redirected | Record | No |
| `tiers` | The model-tier ladder of the harness, lowest first | List of records | No |
| `failures` | Map from the typed failure vocabulary of §C.1 to what signals it: statuses, body patterns, exit codes, stream records | Map | Yes (may be empty) |
| `cost` | Class (`subscription`, `metered`, `local`, `unknown`) and prices with their date, or null | Record | Yes |
| `isolation.envAllow` | The only variables handed to a call | List of text | Yes |
| `isolation.configHome` | Variables and seeds of an overlay (§C.16) | Record | No |
| `containment.ceiling` | Highest containment level the harness can enforce, with provenance | Member of §C.15, with provenance | Yes |
| `memory` | Whether the harness has native memory and how it is switched off | Record | Yes |
| `telemetry.off` | Variables or flags that switch the harness's own telemetry off | Record | No |
| `concurrentSessions` | Whether several processes may run at once under one configuration home and one login, with separate session stores | Truth value with provenance, or null | No |
| `spendLimit` | Whether a process-level spending limit can be set, and how | Record with provenance, or null | No |
| `transports` | The transports offered, each with auth tier and terms row | List of records | No; default one `subprocess` or `direct-call` by kind |
| `versionRange`, `verifiedOn` | Tested range and date; present only on a tested harness adapter | Text, date | For a tested harness adapter |

Placeholders in an argument list are a closed set: `{prompt}`, `{promptFile}`, `{workdir}`,
`{emptyTmp}`, `{model}`, `{sessionId}`, `{file:<name>}`.

- **F100-FR-084**: The harness descriptor MUST hold the fields of §C.2. It MUST be data only: argument lists are lists and never shell text. An unknown top-level key MUST refuse the descriptor; keys under `x-` MUST be ignored. A descriptor whose `descriptorVersion` is outside the accepted range MUST be refused with a doctor finding.
  - test: CT-100-184
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-085**: A harness MUST be in one of the four states `tested`, `locally-verified`, `declared`, `detected`. A harness that is not `tested` is unverified: it has no version pin, its capabilities are declared or probed, it runs at auth tier 1 or 2 only, and the doctor shows it as unverified. A descriptor MUST be accepted from user configuration, the environment, flags and the product's bundled data only.
  - test: CT-100-185
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-086**: A secret MUST be sent only to the host it was declared for. A plain, unencrypted endpoint MUST be refused unless it is the loopback address. Redirects MUST be refused. A free read-only request to a model list MAY carry the credential; the value MUST never be stored or logged.
  - test: CT-100-186
  - ep: EP-02 `specstride.harness/1` (implements)

## §C.3 Forms of the `completion` level

| Form | Id | Meaning | Open to | Proof |
|---|---|---|---|---|
| First | `tool-less` | No tools by any route | Every harness that qualifies | The initial record of the call shows an empty tool list and the session identity that F100-FR-230 asks for. For a harness whose stream has no initial record: an exact version pin together with the preflight of the harness adapter and the flag set of the call, open to a tested harness adapter only, and recorded as the weaker proof (F100-FR-230, case 3) |
| Second | `read-only-tools` | The critic runs in the working tree inside a read-only sandbox of the operating system and may read project files by itself. It cannot write, cannot run a command that writes and cannot reach the network | A tested harness adapter only | The call record shows the read-only sandbox mode, the network off, and the confirmation of the harness adapter that the withheld paths of §C.4 cannot be read |

- **F100-FR-087**: The `completion` level MUST have exactly the two forms of §C.3. A critic-class call whose proof is missing or fails MUST be refused with `critic_not_toolless`. A critic path MUST NOT ever receive a flag that allows all tools. The result of the proof MUST be recorded for every critic-class call.
  - divergence: DV-081
  - parity: the critic of each harness in its as-is transport and mode (row 28 of annex X §X.7)
  - test: CT-100-187
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-088**: A critic of either form MUST receive the grounding snapshot and, where one exists, the fact block in its prompt, and its verdict MUST be bound to the nonce of the call. Before a critic of the second form starts, the runtime MUST move the proposer's notebook, handoff and outbox out of the working tree, and MUST move them back after the call. The move holds for every critic-class call, the diagnostician included. The second form is a stated exception to the rules that the critic judges from the grounding snapshot only and holds no tools, and it is limited to reading project files.
  - test: CT-100-188
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F100-FR-230**: The proof of a critic-class call MUST show that the call ran in a session of its own, in one of three ways, and MUST record which: (1) the harness takes a session id from the caller, and the initial record shows the id that the runtime minted; (2) the harness gives the id itself, and the id of the initial record equals no session id of any pass of the run; (3) the initial record carries no session, and the weaker proof applies, for a tested harness adapter only: the exact version pin, the preflight of that harness adapter and the flag set of the call, recorded for every call that rests on it as the weaker proof (§C.3, first form). A proof that fails MUST refuse a configured critic with `critic_not_toolless`, which halts the run, and MUST pass over an automatically picked one. Under the `parity` profile no proof is made, as at the baseline.
  - test: CT-100-330
  - divergence: DV-081; DV-110
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: no proof is made for any harness: the as-is transport and mode of each harness, which made no proof (row 28 of annex X §X.7), and `harnesses.dsh.critic.proof` = `none` (row 117 of annex X §X.7)
  - assumption: CQ-110; CQ-117 (two harness adapters proceed on different proofs of the session; both are admitted as cases 2 and 3); CQ-182 (answered by the owner on 2026-09-30: the weaker proof of case 3 is allowed for a tested harness adapter only; Principle IX of constitution v3.0.1 names it, so case 3 passes the principle; the absence of a proof under the `parity` profile for every harness, rows 28 and 117 of annex X §X.7, is a stated deviation from Principle IX under that profile, plan Complexity Tracking; both rows of the plan stay until the first implementation slice removes them)

- **F100-FR-231**: A critic MUST run only on a model whose context window is known. A window that the consumer declares (`roles.critic.contextTokens`, or the window of a model in `harnesses.<id>.contextWindows`) MUST always win, and where a declared and an effective window differ the smaller MUST be used. A model whose window is not known MUST NOT qualify for an automatic pick. Outside the `parity` profile, a critic that the consumer configured on a model that is not listed and for which the consumer declares no window MUST be refused by the harness adapter; a fallback window MUST NOT be used. Under the `parity` profile the as-is fallback window of each harness MUST apply to such a critic (128,000, 200,000 or 98,304 tokens, as the baseline of that harness has it; DV-106, DV-111).
  - test: CT-100-331
  - divergence: DV-106; DV-111; DV-099 (the over-window prompt under `parity`, owned by feature 117)
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the as-is fallback window of each harness (row 28 of annex X §X.7), the window limit of row 55, and a critic prompt still over the window sent as at the baseline (row 57, `prompt.critic.overWindow` = `send`, DV-099, stated by feature 117); a stated deviation from Principle IX under the `parity` profile, plan Complexity Tracking (assumption: CQ-145)
  - assumption: CQ-145; CQ-202 (answered by the owner on 2026-09-30: a configured critic on an unlisted model with no declared window is refused outside the `parity` profile, and the as-is fallback holds under `parity` only; features 125 and 131 carry the same); CQ-118

## §C.4 Withheld paths

| Subject | Content |
|---|---|
| Schema id | `specstride.withheld-paths/1` |
| Writer | Engine, per critic-class call of the second form |
| Readers | The harness adapter of the critic; the call record |
| Content owner | 117 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `deny` | Real paths the sandbox must deny for reading: the workspace part, the control plane, the event stream, the worker root, the tree store | List of records of logical root and real path | Yes |
| `moved` | The proposer's files moved out of the working tree for the call: notebook, handoff, outbox, each with where it was and where it is kept | List of records | Yes |
| `confirmed` | Whether the harness adapter confirmed the denial before the call | Truth value | Yes |

- **F100-FR-089**: The list of withheld paths MUST hold the five locations of §C.4. The harness adapter MUST confirm the denial before the call. Without the confirmation the second form MUST NOT be used: a configured critic is refused with `critic_not_toolless`, and an automatically picked one is passed over for the next candidate of the critic order, announced and recorded.
  - test: CT-100-189
  - status: unverified (check: the read-only sandbox of the first harness of this form denies reads of paths outside and inside the working tree that are on the list; verified-on: —; pin: version of that harness at the capture)

## §C.5 Stream readers and the dialect table

A stream reader turns the raw stream of a harness into normalized records. The kinds of normalized
record are a closed set: `init`, `text`, `tool`, `usage`, `error`, `terminal`. For a text stream
the reader synthesizes `init` and `terminal`.

| Subject | Content |
|---|---|
| Schema id | `specstride.stream-dialect/1` |
| Content | One row per harness of the family that shares the JSONL reader for stream schema version 3 |
| Writer | Product data. One row per harness adapter of the family |
| Readers | The JSONL reader; the harness adapters of the family; the doctor |
| Content owner | 138 for the reader and the table; 134 for one row. A later harness of the family adds a row and no code |

| Field of a row | Meaning | Type in words | Required |
|---|---|---|---|
| `dialect` | Name of the dialect | Text | Yes |
| `schemaVersions` | Versions of the stream's session header that the row accepts | List of whole numbers | Yes |
| `providerFormat` | The literal by which the stream names its provider format | Text | Yes |
| `telemetryOff` | Variables and flags that switch the harness's telemetry off | Record | Yes |
| `sessionControl` | Variables and flags that switch sessions off, name a session directory, and continue a session by id | Record | Yes |
| `extraRecords` | Record types of this dialect beyond the common ones, each with the normalized kind it maps to, or `ignore` | Map | Yes (may be empty) |
| `usageNames` | Names under which the dialect reports input, output, cache and reasoning tokens and cost | Record | Yes |
| `terminalDecides` | Whether success is decided by the terminal record of the stream and not by the exit code | Truth value | Yes |
| `limits` | The cap on the size of a line and on the rate of lines, where the dialect needs other values than the stream seam | Record | No |
| `endWords` | The words at the end of an agent's stream that mean an error and those that mean success, where the dialect needs other words than the reader's | Record of two lists | No |

The dialect row also carries `trackTerminal` (feature 126, the reader of prime): where it is set,
a second terminal record of one stream is dropped with the reason `duplicate_terminal`, and the
first decides. The row `prime-v3` sets it; the condition needs no field of its own (item 3 of the
report of feature 126: the condition is confirmed).

- **F100-FR-090**: There MUST be one registry from `stream.format` to a stream reader. A reader MUST produce only the six normalized records. A reader MUST parse only the harness's own framing, MUST never read the output of a tool as a stream record, MUST enforce a cap on line size and rate, and MUST report a stream that ends without a terminal record. A new stream format MUST be addable as data through `stream.mapping`, with no code.
  - test: CT-100-190
  - ep: EP-02 `specstride.harness/1` (implements)

- **F100-FR-091**: The harness adapters of pi and prime MUST share one JSONL reader, and what differs between them MUST be data in the dialect table of §C.5. A stream whose session header names a version outside `schemaVersions` MUST be refused. Where `terminalDecides` is true, the outcome of a call MUST be taken from the terminal record.
  - divergence: DV-090
  - parity: the prime critic runs in text mode, as at the baseline (row 28 of annex X §X.7)
  - test: CT-100-191
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the stream of pi in JSON mode passes the reader, and its exit code on a provider error is captured; verified-on: —; pin: pi version of the fixture capture)

## §C.6 Resolved registry and role plan

| Subject | Content |
|---|---|
| Schema id | `specstride.registry/1` |
| Logical name | `run:<runId>:registry` |
| Writer | CLI at launch |
| Readers | Engine, quota and fallback handling, doctor, digest |
| Content owner | 124 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `schema` | Schema id | Text | Yes |
| `harnesses` | Every harness of the registry: id, state, origin, version, hash of the descriptor, resolved path, capabilities with provenance, containment ceiling, source of each value | List of records | Yes |
| `roles` | The registered roles. Wave 1 registers `proposer` and `critic`; `diagnostician` and `accelerator` run under the critic-class and proposer rules | List of records: role id, capability level required, independence constraints, budget key | Yes |
| `plan` | Per phase and per role: the ordered list of entries to use, first the primary and then the fallbacks the consumer opted into. Each entry: harness, model, model tier, auth tier, transport, form of the `completion` level, containment level, decision of the terms gate with the row it rests on | Map | Yes |
| `criticPick` | How the critic was chosen: step of the critic order, state, window and its source, the reason, and whether the critic-diversity warning was raised | Record | Yes |
| `runnersUp` | The ranked candidates that were not picked, each with the reason, in the order in which a pass-over takes them | List of records | Yes (may be empty) |
| `announced` | The lines announced at launch | List of text | Yes |

Critic order, with the place of both forms:

| Step | Candidate |
|---|---|
| 1 | The critic the consumer configured. Discovery never overrides it |
| 2 | A second model through the gateway of the host |
| 3 | A qualifying discovered harness, tested before unverified. Inside this step every tool-less candidate stands before every candidate with read-only tools |
| 4 | The default harness on a different model tier, in a fresh session, without tools, with a set budget |

- **F100-FR-092**: Role resolution MUST write the resolved registry and role plan with the fields of §C.6 at launch. The engine MUST walk the plan; a resolution MUST NOT take place after launch. A resume or relaunch MUST read the record and MUST NOT rank again unless the consumer asks by flag or the stored pick no longer exists.
  - test: CT-100-192
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F100-FR-093**: An automatically picked critic MUST follow the four steps of §C.6. An unverified harness of kind `cli` MUST never be picked automatically. A harness whose terms are unknown and that the consumer did not name MUST never be a default and MUST never be picked automatically; it is usable when the consumer names it, with the unknown-terms warning. An automatically picked critic on a metered endpoint MUST have a hard spending cap, announced at launch. The pick MUST be announced, recorded and shown in the digest.
  - divergence: DV-049
  - parity: every fixture names the critic (row 35 of annex X §X.7)
  - test: CT-100-193
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F100-FR-094**: Roles MUST be an open registry: a role has an id, the capability level it needs, its independence constraints against other roles, and its budget key. Role resolution MUST resolve every registered role.
  - test: CT-100-194
  - ep: EP-02 `specstride.harness/1` (implements)

## §C.7 EP-03 Spec-format adapter, and the canonical spec model

#### Id and version
`specstride.spec-format/1`.

#### Purpose
To read a specification in any supported format into one canonical model, so that one grammar
owner serves the engine, the critic, derivation of the launch contract, the CLI, the doctor and
the UI.

#### Caller and time
The CLI and the engine call `detect`, `parse` and `validate` at launch and at resume. The engine
calls `tick` after an approval and, with parallel units on, after a group was applied. Every
reader of source hashes calls `inputs`.

#### Inputs
`detect`: a path and the head of its content. `parse`: the files of one feature. `validate`: a
canonical model. `tick`: task ids, or a phase number, which ticks every task of the phase as the
as-is command does. `inputs`: nothing.

#### Outputs
`detect`: whether the spec-format adapter claims the path, and its `priority`. `parse`: the
canonical spec model. `validate`: findings. `tick`: the edited checkboxes, in place. `inputs`: the
sources of a declared kind with their hashes from the canonical hasher of annex X §X.5: the content
hash, and for a task list the hash that ignores checkboxes.

#### Errors
`invalid-spec` and `ambiguous-candidates` (engine exit 3, with the as-is listing); `unknown-format`
(exit 3 of the spec command).

#### Guarantees of the core
One grammar owner. The detection order is the order of the registry and is the as-is order:
explicit override, file name, content. Built-in formats win; a new format is detected only where
they decline or where it is named explicitly. The position at which a run resumes is derived by
the engine from approval records, never by a spec-format adapter.

#### Guarantees of an implementation
`parse` is a pure function of the files. `tick` changes checkboxes only and keeps every other
byte. Hashes are stable across runs and platforms.

#### Failure of an implementation
A spec-format adapter that fails in `detect` is passed over. One that fails in `parse` or
`validate` gives `invalid-spec`. A failed `tick` leaves the file unchanged and is reported; it
never undoes an approval.

#### Unknown-value rule
An unknown format name is `unknown-format`. `openspec` is accepted as an alias of
`openspec-change`. An unknown task marker is kept as text in the task.

#### Wave 1 implementations
`native`, `speckit-tasks`, `openspec-change` with the alias `openspec`.

#### Content owner
104.

#### Proving test
Conformance on the format fixtures of the oracle: golden models, round trip of `tick`, stability
of hashes. A sample format registered from the test tree is detected, parsed and run.

Canonical spec model:

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `format` | Id of the format | Text | Yes |
| `feature` | Feature slug | Text | Yes |
| `sources` | The source files with kind (`spec`, `plan`, `tasks`, other) and hashes | List of records | Yes |
| `phases` | Per phase: number, title, section, acceptance criteria | List of records | Yes |
| `phases[].tasks` | Per task: id, markers (for example `[P]` and story tags), text, whether ticked, line | List of records | Yes (may be empty) |

The four-field view of a phase that the oracle pins (number, title, section, criteria) is a
projection of the model.

- **F100-FR-095**: The spec-format port MUST offer the operations `detect`, `parse`, `validate`, `tick` and `inputs` of §C.7 and MUST produce the canonical spec model with structured tasks. Every component that reads a specification MUST read the canonical model; a second parser MUST NOT exist.
  - divergence: DV-060
  - test: CT-100-195
  - ep: EP-03 `specstride.spec-format/1` (implements)

- **F100-FR-096**: The format names and the detection order MUST be those of the Specstride baseline. An explicit format `openspec` MUST be accepted as `openspec-change`.
  - divergence: DV-073
  - test: CT-100-196
  - ep: EP-03 `specstride.spec-format/1` (implements)

## §C.8 EP-05 Check runner

#### Id and version
`specstride.check-runner/1`.

#### Purpose
To run a deterministic command for the verification gate, for an inner check, for the closing
check, for the merge check and for a job the runtime launches, so that a result means the same
everywhere.

#### Caller and time
The engine: `pin` at launch for every entry of the check manifest; `start`, `poll`, `result` and
`cancel` whenever a check runs. `environment` whenever a caller outside the runner needs the
environment a command would get (the detached command staged before, F105-FR-035).

#### Inputs
`pin`: an entry of the check manifest. `start`: the pinned identity, the working directory, the
environment allow-list, the time limit, the containment level. `poll`, `result`, `cancel`: a handle.
`environment`: an entry of the check manifest (its declared `env`) and the profile in force.

#### Outputs
`pin`: an identity record of a declared kind; for the kind `command` the absolute path of the
executable with its size and hash. `start`: a handle. `poll`: running or ended. `result`: exit
code, duration, a reference to the captured output, and the conditions, each in a field of its
own, from the closed set `tainted`, `cached`, `flaky`, `interrupted`, `unchecked` with its reason
(the reasons include `changed-during-check`, `slow`, `budget`), and optional findings.
`environment`: the environment the kind `command` would give that entry: the allow-list with no
provider credential overlaid with the declared `env`, and under the `parity` profile the
environment of the process overlaid with the declared `env` (row 125 of annex X §X.7). It starts
no process and returns no handle.

#### Errors
`cannot-start`, `timeout`, `interrupted`.

#### Guarantees of the core
A check is run by the runtime and never by the proposer's harness. Before a check the runtime ends
every process of the pass it can identify, except a job held by an accepted yield. The protected
set is fingerprinted before and after every check; a check run against a changed set is `tainted`
and never a pass. Every command of a set runs in every check; a check does not stop at a failure.
Every run of a command emits `check.started` and `check.ended`. Output is captured through the one
ingress, with a cap. The environment that `environment` returns equals the one `start` gives the
same entry.

#### Guarantees of an implementation
The kind `command` runs a fixed argument list without a shell, in a process group of its own, with
an environment that holds no provider key, at the proposer's containment level or stricter, with
no write access to the control plane.

#### Failure of an implementation
A runner that cannot start a command returns `cannot-start`; at the verification gate that is a
failed command, and in an inner check the loop layer is off for the phase attempt. A runner that
throws is treated as `cannot-start`.

#### Unknown-value rule
An unknown kind of identity refuses the entry at `pin`, at launch. An unknown condition in a
result makes the result `unchecked`.

#### Wave 1 implementations
`command`. As an option that is off by default: `steps`, the step runner.

#### Content owner
148. Feature 105 consumes the runner and keeps EP-07.

#### Proving test
Conformance with scripted commands: pass, fail at step n, slow, never ending, very large output.
A sample runner registered from the test tree serves an entry of its kind.

- **F100-FR-097**: The check runner MUST be handle-based with the operations `pin`, `start`, `poll`, `result`, `cancel` and `environment` of §C.8, and MUST return the result with each condition in a field of its own. The verification gate, inner checks, the closing check and the merge check MUST use the same runner.
  - test: CT-100-197
  - ep: EP-05 `specstride.check-runner/1` (implements)

- **F100-FR-098**: Around every command of the verification gate and around the grounding pass the protected set MUST be fingerprinted before and after. A difference MUST become a fact for the critic and MUST NOT halt the run. A result obtained against a changed set MUST carry the condition `tainted`.
  - divergence: DV-076
  - parity: off (row 31 of annex X §X.7)
  - test: CT-100-198
  - ep: EP-05 `specstride.check-runner/1` (consumes)

- **F100-FR-099**: Concurrency of verification commands MUST be a parameter, `verification.parallelism`, with the default 1 and the ceiling 4. A command MUST run beside another only when the check manifest declares the reads and the writes of both and neither reads what the other writes. An undeclared command MUST run alone. A command that fails in a batch of more than one MUST be run once more alone, and both results MUST be stated.
  - divergence: DV-080
  - parity: 1 (row 7 of annex X §X.7)
  - test: CT-100-199
  - ep: EP-05 `specstride.check-runner/1` (implements)

- **F100-FR-100**: The step runner MUST be an option, `verification.step_runner`, that is off by default. Steps are fixed argument lists run by the runtime, which stops at the first failed required step and can resume from it. A resumed run of steps is partial and MUST never count as evidence of a pass.
  - parity: off (row 6 of annex X §X.7)
  - test: CT-100-200
  - ep: EP-05 `specstride.check-runner/1` (implements)

- **F100-FR-232**: A command that is staged before the verification gate MAY be reused by the verification gate only under the reuse policy that its declaration names (`per-attempt`, `per-phase`, `per-run`) and only while the tree is provably the tree of the staged run: the same revision, and a clean working tree in the record of the staged run and at the verification gate, as at the baseline (B-1128). The result of a staged command MUST be kept under `attempt:<N>:<k>:<n>:prestage`. With a loop layer engaged in the phase attempt, that is, with a unit of work declared in it (annex D, F100-FR-118), the verification gate MUST reuse nothing. The engine MUST hand this fact to the verification gate as an input of its call; the verification gate reads no record of a loop layer. The rules are stated by the owner of the verification gate (F105-FR-033).
  - test: CT-100-332
  - ep: EP-05 `specstride.check-runner/1` (implements)

## §C.9 EP-07 Verification-plan source

#### Id and version
`specstride.verification-source/1`.

#### Purpose
To find the verification commands that a project declares, with where each was declared, and
never to invent one.

#### Caller and time
The engine at launch, and the derivation of the launch contract.

#### Inputs
`discover`: the workspace and the canonical spec model. `obligations`: the canonical spec model.
`conflicts`: the results of every source.

#### Outputs
`discover`: declared commands, each with provenance (file and line), phase, time limit, an
optional list of tasks, optional steps, optional declared reads and writes, optional exclusive
resource. `obligations`: one verification obligation per task line. `conflicts`: blockers. Under
the recommended answer of CQ-190 a source that reads repository text reports no declared reads
and no declared writes: a declaration that lacks the provenance of user configuration, the
environment or a flag counts as undeclared, and by ruling P11 the commands it concerns run
serial.

#### Errors
A command that cannot be written as a fixed argument list, and two declarations that disagree,
are blockers and never a guess.

#### Guarantees of the core
The verification plan is bound to the hashes of its sources, frozen at launch and stored in the
control plane. The check manifest of a phase is derived from it and from nothing else. A phase
without commands stays explicitly empty. A relaunch that derives a different manifest makes the
difference a fact for the critic and uses the stored manifest.

#### Guarantees of an implementation
A source reads and never writes. It reports only what is declared in a file it names.

#### Failure of an implementation
A source that fails contributes nothing and is reported as a finding; under the verification mode
`required` a phase left without commands by a failed source refuses the launch.

#### Unknown-value rule
An unknown field of a declaration is ignored with a finding. An unknown verification mode is a
configuration error (exit 3).

#### Wave 1 implementations
The verification-commands document; commands declared literally in the plan or the task list;
discovery of the entry points of a toolchain for build, type check, lint and test; the inventory
of the launch contract.

#### Content owner
105. The inventory of the launch contract as a source: 107.

#### Proving test
Conformance on fixtures with declared commands, with conflicts and with none. A sample source in
the test tree contributes a command that appears in the check manifest with its provenance.

- **F100-FR-101**: A verification-plan source MUST offer `discover`, `obligations` and `conflicts` as in §C.9. The verification plan MUST be frozen at launch, bound to the hashes of its sources and stored in the control plane.
  - test: CT-100-201
  - ep: EP-07 `specstride.verification-source/1` (implements)

- **F100-FR-102**: The verification modes MUST be the closed set `required`, `plan`, `off`, with the default `required`. The verification gate MUST run before the critic; when it fails the engine writes the feedback itself and does not call the critic. Derivation of a launch contract MUST state the mode it sets and MUST prefer `required` where commands are declared.
  - divergence: DV-040; DV-043
  - test: CT-100-202
  - ep: EP-07 `specstride.verification-source/1` (consumes)

- **F100-FR-103**: The check manifest derived on a relaunch MUST be compared with the stored one. A difference MUST become a fact for the critic, and the stored manifest MUST apply.
  - divergence: DV-078
  - parity: off (row 33 of annex X §X.7)
  - test: CT-100-203
  - ep: EP-07 `specstride.verification-source/1` (consumes)

## §C.10 EP-08 Event sink

#### Id and version
`specstride.event-sink/1`.

#### Purpose
To deliver events to a destination other than the primary event file.

#### Caller and time
The one event writer, after it has written an event to the primary file.

#### Inputs
`open`: the context of the run. `write`: one event, in the order of `seq`. `flush`, `close` and
`status`: nothing. A sink declares the range of event schema majors it accepts.

The context of `open` holds: the identifiers of the run (`runId`, `launchId`, `engineStartId`,
feature, workspace); the four as-is labels `job`, `service.name`, `task` and `backend`, which the
as-is form of a payload needs; the profile and the resolved switches that concern sinks; a
content accessor, which returns content by reference, redacted, and returns nothing while
capture is off; and read access to the table of the compatibility projection, from which a sink
learns the as-is name of an event. The content accessor serves the compatibility projection with
its own as-is snippets whatever the switch of content capture says.

#### Outputs
None that the run depends on. `status` returns the delivery status of the sink as one line and
as a record: sink label, receiver state, the last delivery status and its reason.

#### Errors
Every error is contained in the sink. The writer records `telemetry.delivery` and goes on.

#### Guarantees of the core
Local first: the primary file is written before any sink is called, and it is authoritative. The
primary file writer is part of the core and is not replaceable. Events reach a sink already
redacted. The event file holds references to content and never content; content reaches a sink
only through the redaction point and only while content capture is on.

#### Guarantees of an implementation
A sink never blocks the writer beyond its time limit, never throws into the loop, and never reads
the control plane.

#### Failure of an implementation
A slow, failing or dead sink is skipped for the event, its failure is recorded, and the outcome of
the run and the primary event file are unchanged.

#### Unknown-value rule
A sink ignores fields and event types it does not know. Event types that start with `x.` belong to
third parties; they are never projected and never change the read model.

#### Wave 1 implementations
The compatibility projection sink; the OTLP exporter; the Loki sink.

#### Content owner
111 (core side, writer, conformance suite, sample sink). The compatibility projection sink: 144.
The OTLP exporter and the Loki sink: 128.

#### Proving test
Sink conformance: a slow sink, a throwing sink and a dead collector leave the outcome and the
event file of a fixture run unchanged. A sample sink that keeps events in memory is registered
from the test tree.

- **F100-FR-104**: An event sink MUST offer `open`, `write`, `flush`, `close` and `status` as in §C.10, and the context of `open` MUST hold what §C.10 lists. A sink MUST receive an event only after the primary writer has written it, already redacted. A failure of a sink MUST NOT change the outcome of a run or the primary event file.
  - test: CT-100-204
  - ep: EP-08 `specstride.event-sink/1` (implements)
  - assumption: CQ-032; CQ-119 (what the context of `open` holds; three features proposed parts of it, and the context holds all of them)

- **F100-FR-105**: The compatibility projection MUST be a sink that renders events in the as-is vocabularies through a table with one row per event type, a row that projects to nothing included. It MUST write to files of their own and never to the primary stream. It MUST be on under the `parity` profile and under `compat.legacyEvents`, and off otherwise. It MUST be byte-identical to the baseline on the fixtures of the oracle after normalization; there is no such promise elsewhere.
  - divergence: DV-007
  - parity: on (row 17 of annex X §X.7)
  - test: CT-100-205
  - ep: EP-08 `specstride.event-sink/1` (implements)

- **F100-FR-106**: Prompt and reply content MUST be captured for export whenever traces are on, and the consumer MUST be able to switch capture off. Captured content MUST always pass the single redaction point and MUST be dropped, with a mark that says so, when the redactor cannot run.
  - divergence: DV-083
  - parity: off (row 16 of annex X §X.7)
  - test: CT-100-206
  - ep: EP-08 `specstride.event-sink/1` (consumes)

## §C.11 EP-10 Secret resolver

#### Id and version
`specstride.secret-resolver/1`.

#### Purpose
To turn a secret reference into a value at the moment of use, and never earlier.

#### Caller and time
The harness layer before a call; the doctor for existence only.

#### Inputs
`handles`: a scheme. `exists`, `resolve`, `boundHost`: a reference.

#### Outputs
`handles`: yes or no. `exists`: `yes`, `no` or `unprobed`, and never the value. `resolve`: the
value, in memory, registered with the redactor. `boundHost`: the host the secret may be sent to.

#### Errors
`missing`; `inline-secret`, a configuration error; `unsafe-file`, for a target inside the
workspace or readable by others.

#### Guarantees of the core
A secret is resolved at the moment of use, passed by environment or standard input and never in an
argument list, written to no state, event, log or launch contract, and sent only to its bound
host. Every resolved value is registered with the redactor for exact-match removal.

#### Guarantees of an implementation
`exists` never prints or returns the value. A resolver makes no network call.

#### Failure of an implementation
A resolver that fails gives `missing`. For a role in use, that refuses the launch or, in a run,
leads to the state `blocked-on-human`.

#### Unknown-value rule
A reference with a scheme that no resolver handles is a configuration error. A value that is not
a reference where a reference is required is `inline-secret`.

#### Wave 1 implementations
`env:`, `file:`, `keychain:`. On Linux the existence check of the keychain reads `unprobed` until
a query is found that prints nothing.

#### Content owner
110.

#### Proving test
The canary test of annex X §X.10. A sample resolver for the scheme `test:` is registered from the
test tree.

- **F100-FR-107**: A secret resolver MUST offer `handles`, `exists`, `resolve` and `boundHost` with the errors of §C.11. A secret in configuration MUST be a reference; an inline value MUST be a configuration error that refuses the launch. A `file:` target MUST lie outside the workspace and MUST be readable by its owner only.
  - divergence: DV-023
  - test: CT-100-207
  - ep: EP-10 `specstride.secret-resolver/1` (implements)
  - status: unverified (check: an existence query of the keychain on Linux and on macOS that prints no value; verified-on: —; pin: —)

## §C.12 EP-11 Terms-gate data

#### Id and version
`specstride.terms/1`.

#### Purpose
To decide from dated data whether a provider may be used at an auth tier for an audience.

#### Caller and time
Role resolution at launch; the engine at every switch to a fallback; the doctor.

#### Inputs
`evaluate`: provider, auth tier, audience, acknowledgements of the consumer.

#### Outputs
The decision and the row it rests on.

#### Errors
None of its own. No row means unknown terms.

#### Guarantees of the core
The terms gate is evaluated at launch, at role resolution and at every switch to a fallback. No comment,
flag, mode or project key bypasses it. A front harness is gated by the row of its back end. Auth
tier 3 without an `allowed` row is refused with the explanation.

#### Guarantees of an implementation
A data file holds, per row: provider, auth tier, audience (`personal`, `distributed`), status
(`allowed`, `conditional`, `personal-only`, `refused`), source, access date, the quoted sentence,
and `verified-on`.

#### Failure of an implementation
A data file that does not validate is ignored with a doctor finding, and the shipped file applies.

#### Unknown-value rule
No row: auth tiers 1 and 2 are allowed with a warning, never as a default and never for an
automatic pick. An unknown status is read as `refused`. Data older than 30 days is a doctor
warning.

#### Wave 1 implementations
The data file shipped in the package. A newer file placed in user-level state replaces it.

#### Content owner
147. The harness adapters supply the facts of their rows.

#### Proving test
Table tests generated from the verified terms matrix. A row for a fictional provider in a test
overlay changes the decision with no code change.

- **F100-FR-108**: The terms gate MUST be a pure table with the one function `evaluate` of §C.12, evaluated by the table evaluator. Auth tier 3 MUST ship refused for every provider. For the audience `distributed`, auth tier 2 MUST be the default for the providers whose auth tier 1 is confirmed for personal use only, and auth tier 1 for them MUST be an opt-in marked "personal use only".
  - divergence: DV-048; DV-003
  - parity: audience `personal` (row 34 of annex X §X.7)
  - test: CT-100-208
  - ep: EP-11 `specstride.terms/1` (implements)

## §C.13 EP-12 Quota classifier

#### Id and version
`specstride.quota-classifier/1`.

#### Purpose
To tell a limit of a provider apart from every other failure, so that a run waits instead of
counting an error.

#### Caller and time
The engine, on every failure that a harness adapter reports, and on every gauge it observes.

#### Inputs
`classify`: what the harness adapter saw. `observe`: a gauge of remaining allowance, or a fact a
host observed (from the inbox).

#### Outputs
`classify`: class, confidence, `resetsAt` or null, `retryable`. `observe`: an alert level or
nothing. Classes are a closed set: `quota_window`, `quota_credit`, `rate_limit_transient`,
`overload`, `auth`, `context_window`, `agent_failure`, `provider_other`, `budget_cap`. Confidence
is a closed set: `structured`, `status`, `text`, `stall`, `host`.

#### Errors
None. An input that matches no entry is `provider_other` with confidence `text`.

#### Guarantees of the core
The engine acts on the class only. The quota classes spend no pass, no reject, no MALFORMED
count, no error count, no wall-clock budget and no relaunch budget. A classification with the
confidence `text`, `stall` or `host` pauses only after a confirming probe. `quota_credit`, `auth`
and a hard budget cap lead to the state `blocked-on-human`.

#### Guarantees of an implementation
A classifier is a pure table or pure code: no I/O, no clock, no model.

#### Failure of an implementation
A classifier that fails gives `provider_other`; the failure takes the as-is path of consecutive
errors.

#### Unknown-value rule
An unknown class from an implementation is read as `provider_other`. An unknown confidence is read
as `text`.

#### Wave 1 implementations
The `failures` map of a descriptor; code in the tested harness adapters; a default text classifier
whose confidence is `text`.

#### Content owner
127. The classifier entries of a harness: its harness adapter.

#### Proving test
Classifier fixtures per tested harness. A declared map for a fake harness pauses a fixture run and
the reject count stays unchanged.

- **F100-FR-109**: The quota classifier MUST offer `classify` and `observe` with the closed sets of §C.13. A quota pause MUST spend no budget of any kind. `proposer_consecutive_errors` MUST count only failures whose class is `agent_failure` or `provider_other`, or `overload` after its cap.
  - divergence: DV-005
  - parity: not observable (the stub agents emit no quota signal) (row 39 of annex X §X.7)
  - test: CT-100-209
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - status: unverified (check: the quota signal of every Wave 1 harness is captured in a fixture; verified-on: —; pin: harness versions of the captures)

## §C.14 EP-16 Toolchain profile

#### Id and version
`specstride.toolchain/1`. Data.

#### Purpose
To tell the runtime, per toolchain, which files define checks and which locations hold caches, so
that the protected set can be built.

#### Caller and time
The engine at launch, when it derives the check manifest and the protected set; the doctor.

#### Inputs
A profile per toolchain: patterns for files that define checks, cache locations, user-level
configuration files, suppression markers, the executables to pin, seed paths for worker trees, and
per worker the environment that moves a cache which is unsafe for several writers.

#### Outputs
The protected set of a phase and the pins of its executables.

#### Errors
A profile that does not validate is refused at load with a doctor finding.

#### Guarantees of the core
A toolchain without a profile has the basic protection only, and the doctor and the `[LOOP]` line
say so.

#### Guarantees of an implementation
A profile is data. It names no command to run, with one exception: one fixed argument list of
a pinned executable by which the effective configuration of the toolchain is read.

#### Failure of an implementation
A refused profile is treated as absent.

#### Unknown-value rule
An unknown field is ignored with a finding. A toolchain the product does not detect has no profile.

#### Wave 1 implementations
Shipped profiles for the toolchains the product detects. Profiles of the consumer in user
configuration.

#### Content owner
116. Consumed by 105, 148, 142, 143 and 112. The schema file of `specstride.toolchain/1` is written
by feature 116, in the contracts of its specification
(`specs/116-check-integrity-and-unit-evidence/contracts/schemas/toolchain-profile.schema.json`), and
is delivered by it to the `contracts` package. The same holds for every extension point whose
content is data: the content owner writes the schema file, and feature 100 fixes the id.

#### Proving test
A profile for a fictional toolchain in a test overlay changes the protected set of a fixture.

- **F100-FR-110**: A toolchain profile MUST be data with the content of §C.14, accepted from the product and from user configuration. The protected set of a phase MUST be derived at launch from the profiles and stored in the control plane.
  - divergence: DV-052
  - parity: no file of a loop layer exists (row 1 of annex X §X.7)
  - test: CT-100-210
  - ep: EP-16 `specstride.toolchain/1` (implements)

## §C.15 Containment levels

| Level | Meaning |
|---|---|
| C0 | No containment. The harness runs with all tools as the consumer |
| C1 | A restriction at tool level that the harness enforces: no bypass flag, an allow list, project settings of the harness ignored |
| C2 | A sandbox of the operating system for commands, the network off or allow-listed, the control plane and credential paths denied. Whether the sandbox of a given harness denies reads of these paths is `unverified` until a capture of that harness shows it |
| C3 | The whole run inside a container or a virtual machine, supplied by the consumer and detected |

- **F100-FR-111**: Containment MUST be a capability of a harness adapter with the four levels of §C.15. Each harness adapter MUST declare its ceiling with provenance. The runtime MUST use the strongest level available and MUST announce and record it for every run. C0 MUST need an opt-in in user configuration, which the environment, a flag and project configuration MUST NOT give; a proposer whose ceiling is C0 MUST be refused at launch without it. The runtime MUST never assert a sandbox by itself; only under the `parity` profile the harness adapter sets the as-is assertion variable where the baseline sets it.
  - divergence: DV-030; DV-031
  - parity: the permission and containment settings of each harness as at the baseline (rows 25, 26 of annex X §X.7)
  - test: CT-100-211
  - assumption: CQ-183 ("user config" in ruling 34 is read as the user configuration only)
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F100-FR-112**: Parallel units MUST run only at containment C2 or above. On a harness whose level is lower the option MUST stay off for the run, with the reason stated, unless the consumer set `loop.parallel.allow_detect` in user configuration; the environment, a flag and project configuration MUST NOT set it. The run MUST then say `protection=detect`.
  - divergence: DV-080
  - parity: off (rows 20, 23 of annex X §X.7)
  - test: CT-100-212
  - assumption: CQ-183 ("user config" in ruling P2 is read as the user configuration only)
  - status: unverified (check: the sandbox of a harness confines its own file tools to a write root other than the workspace; verified-on: —; pin: harness versions of the capture)

## §C.16 Overlay schema

| Subject | Content |
|---|---|
| Schema id | `specstride-overlay/v1` (the as-is name is kept) |
| Writer | The harness layer, per pass or per phase attempt |
| Readers | The harness layer |
| Content owner | 109 |

| Field | Meaning | Type in words | Required |
|---|---|---|---|
| `contract` | Schema id | Text | Yes |
| `key` | Id of the harness | Text | Yes |
| `vars` | The variables that are redirected to the overlay | List of text | Yes |
| `seeds` | Files placed in the overlay before the call: variable, path, content | List of records | No |
| `unset` | Derived: base directories that are not themselves overlaid, when the home is overlaid | List of text | Derived |
| `scope` | `none`, `pass` or `attempt` | Member of a closed set | Yes |
| `ownerPid`, `ownerStart`, `createdAt` | In the marker of an overlay tree: the process that owns the tree, its start time, and the time of creation | Whole number, text, timestamp | In the marker |
| `markerScope` | In the marker only: `pass`, `attempt` or `critic` | Member of a closed set | In the marker |

- **F100-FR-113**: At auth tier 1 a call MUST use the consumer's real configuration home, never written by the run, with plugins, host hooks, skills and tool servers of the harness off. At auth tier 2 a call MUST use a throwaway home built from an overlay of §C.16. Session state MUST live per phase attempt and MUST be removed when the phase attempt ends.
  - divergence: DV-002
  - parity: overlay scope `none` (row 30 of annex X §X.7)
  - test: CT-100-213
  - ep: EP-02 `specstride.harness/1` (consumes)
