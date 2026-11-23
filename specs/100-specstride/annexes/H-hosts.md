# Annex H — Hosts (L7)

Part of the specification of feature `100-specstride`. Normative.

This annex holds the interface of EP-01: the host package contract and the capabilities of a host.
The other half of EP-01, the CLI protocol, is in annex G §G.1. The common rules of annex A §A.4
hold.

A host is the product that runs the host skills. One product can be both a host and a harness;
every sentence says which is meant.

How to cite: "annex H, §H.1 EP-01 Host port, F100-FR-193".

## §H.1 EP-01 Host port

#### Id and version
`specstride.host/1`. The CLI protocol has its own integer, 1 (annex G §G.1).

#### Purpose
To let a host offer the host skills of the product as a thin layer over the CLI, in the form the
host needs, inside a token budget.

#### Caller and time
The build of the product calls a host package to render its artifacts. The host calls the CLI at
run time. The build calls the eval driver on a stub of the host's suite runner; a run on the host's own runner calls a model and is started by a person.

#### Inputs
| Operation | Inputs |
|---|---|
| `describe` | Nothing |
| `renderSkill` | One skill source: logical id, body, references with the condition under which each is read, budget |
| `renderEntry` | The logical id of a command, such as `doctor` |
| `renderStatusHooks` (optional) | The logical name of the precomputed status line |
| `evalDriver.run` | A suite of trigger cases |

#### Outputs
| Operation | Outputs |
|---|---|
| `describe` | The capabilities of the host: the naming rule of skills and the cap of a description; host hook events, or none; a background primitive, or none; a status surface; an eval driver; the packaging form; `stateRootWritable`; whether the host has a model |
| `renderSkill` | The host's artifact for the skill |
| `renderEntry` | The host's spelling of the command |
| `renderStatusHooks` | Shims that print the precomputed status line without starting the product |
| `evalDriver.run` | One result per case |

The whole output of a host package is an artifact tree (for example a plugin directory or a skill
directory) and eval results.

#### Errors
`capability-absent`, with the declared fallback; `budget-exceeded`, which fails the build;
`protocol-mismatch`, refused with one line that names the doctor: the shim of the host package
prints `[SPECSTRIDE-REFUSE] action=protocol reason=protocol-mismatch` with the two integers and
exits 4 (annex G §G.4). The shim finds the executable through the variable `SPECSTRIDE_BIN`,
then the search path.

#### Guarantees of the core
Every fact a host needs is a line of the CLI. Default output is terse and inside the budget; an
unchanged state prints nothing on `wait`. No run depends on a host hook, a monitor or a host
process. The logical ids of skills and commands are stable; their spelling is the host's. The
consumer's comment is stored with its hash before any repository text is printed.

#### Guarantees of an implementation
A host package reads no file of the product and names no path into the product's source or
state. It never installs or updates the CLI by itself: it detects, reports and prints the command.
It passes the consumer's comment verbatim. It prints the digest verbatim. It launches by
invocation and withholds the launch only in the mode `dry-run`.

#### Failure of an implementation
Each optional capability has a declared fallback, and a host package that lacks the capability
uses it: no host hooks means that alerts arrive through `status` and the digest; no background
primitive means that the budget of one supervision cycle applies to every cycle; no native eval
driver means the session-log driver; a host without a model delegates judgment as in annex G §G.9;
a state root that the host cannot write means a control root the host permits, set in user
configuration.

#### Unknown-value rule
An unknown capability in `describe` is ignored. An unknown logical id of a skill or a command
fails the build of the host package.

#### Wave 1 implementations
The host package for Claude Code; the plain shell, which is also the test host.

#### Content owner
113.

#### Proving test
The host conformance suite, run against the plain shell and against each host package: it plays
the command sequences of both host skills on fixtures of the oracle with stub agents, measures
bytes against the budgets, checks the reference closure (no path into the product's source or
state), and checks that the artifact tree validates. The case of survival after detaching runs
where a live host is available and is reported as a skip with its reason elsewhere.

Capabilities of a host:

| Capability | Values | Fallback when absent |
|---|---|---|
| `hooks` | The host hook events the host offers | Alerts through `status` and the digest |
| `statusSurface` | Where a status line can be shown | `status --line` on request |
| `background` | A primitive that re-invokes the host when a command exits | The budget of one supervision cycle per cycle |
| `evals` | A native driver for skill-trigger evals | The session-log driver |
| `model` | Whether the host has a model | Judgment delegated to a harness named in user configuration |
| `stateRootWritable` | Whether the host's shell and the detached runtime can write the control root | A control root the host permits, set in user configuration |

- **F100-FR-193**: A host package MUST offer `describe`, `renderSkill`, `renderEntry` and `evalDriver.run`, and MAY offer `renderStatusHooks`, as in §H.1. It MUST declare every capability of the table of capabilities, and the product MUST use the declared fallback for each absent one.
  - test: CT-100-293
  - ep: EP-01 `specstride.host/1` (implements)

- **F100-FR-194**: The product MUST have two host skills with the logical ids `specstride-run` and `specstride-reverse`, and a doctor skill. A host skill MUST be a thin layer over the CLI: it MUST be operable without reading the product's source, its state or a launch contract, and its happy path MUST need no reference file.
  - divergence: DV-056
  - test: CT-100-294
  - ep: EP-01 `specstride.host/1` (implements)

- **F100-FR-195**: Each host skill MUST stay inside its token budget of annex G §G.5, and the build MUST enforce it by measuring bytes.
  - test: CT-100-295
  - ep: EP-01 `specstride.host/1` (implements)

- **F100-FR-196**: Invoking the host skill `specstride-run` MUST be the consumer's consent to launch. The consumer's optional comment MUST steer the run and MUST NOT be able to bypass a launch check, the terms gate or a budget. The host skill MUST say what it changed because of the comment.
  - divergence: DV-009
  - test: CT-100-296
  - ep: EP-01 `specstride.host/1` (implements)

- **F100-FR-197**: A host package MUST never install or update the CLI without the consumer noticing. On a missing or mismatched CLI it MUST report through the doctor and print the command to run.
  - test: CT-100-297
  - ep: EP-01 `specstride.host/1` (implements)
  - status: unverified (check: every fact about host behaviour that comes from documentation only, among them the lifetime of a background host hook, is captured on a live host; verified-on: —; pin: host version of the capture)
