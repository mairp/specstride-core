# Research: Detached runtime (feature 122)

Phase 0 of the plan. The research itself is in `docs/ecosystem/research/`; this file records the
decisions of the plan and links to it. No `NEEDS CLARIFICATION` is left.

| Report | What this feature takes from it |
|---|---|
| [R15](../../docs/ecosystem/research/R15-ecosystem-architecture.md) A-5, A-7 | The process tree, the life cycle, the spike of A-7.4 |
| [R15v](../../docs/ecosystem/research/R15v-architecture-red-team.md) A-7, B-9, D-1 to D-8, P-2, P-3, P-6, P-13, P-14 | The amendments: lease verification, handshake outcomes, the marker, the state commands, writability of the control root |
| [R2v](../../docs/ecosystem/research/R2v-port-size-verification.md) "Lock design risks" | The shape of the lock; the ten risks; the two tested alternatives |
| [R3](../../docs/ecosystem/research/R3-claude-code-host.md), [R3v](../../docs/ecosystem/research/R3v-host-facts-verification.md), [R4](../../docs/ecosystem/research/R4-dsh-host.md) | What a host does to the process tree of a command; the sandbox of the shell tool |
| [R11](../../docs/ecosystem/research/R11-security-threat-model.md) T-26, T-27, T-29 | The identity check; the stale lock; permissions |
| [R14](../../docs/ecosystem/research/R14-quotas-cost-observability.md) risk 10, EV-29 | Waits recomputed from recorded times; liveness is never an event |
| [R16](../../docs/ecosystem/research/R16-doctor-config.md) F8 | What the doctor needs from the lock |
| [R29](../../docs/ecosystem/research/R29-parallel-units-design.md) PU-32, [R29v](../../docs/ecosystem/research/R29v-parallel-units-red-team.md) V-12, PU-90 | The worker id in a registry entry; ending processes that outlive the engine |

## Decisions

### D-1 Mutual exclusion: a directory, with the owner record renamed into place

- **Decision**: the lock is a directory. The contender builds a temporary directory that already holds the owner record and renames it to the name of the lock. A rename onto an existing, non-empty directory fails, so exactly one contender wins and the lock never exists without its owner record.
- **Rationale**: ruling 23; R2v risks 1 and 2 (the owner-file window of the Lisa precedent). `verified-local` for Linux by R2v's scripts; macOS `unverified`.
- **Alternatives considered**: a kernel lock through a native addon (rejected: compiles at install, ruling 23); `mkdir` then writing the owner file (rejected: R2v risk 2); the experimental database module of the runtime platform as a lock (rejected: experimental, and POSIX locks are per process).

### D-2 Liveness: a listening local socket

- **Decision**: the owner listens on a local stream socket. A prober connects: success means the owner lives; a refused connection with the socket file present means the owner is dead. The socket accepts and closes; no byte is read or written.
- **Rationale**: R2v tested it (`verified-local`): after the holder was killed without warning, the connection was refused at once. The kernel decides, not a process id. Principle I allows an endpoint that carries no data.
- **Alternatives considered**: process id with start time only (kept as a second signal and for the identity check, not as the liveness; R2v risks 4 to 6); age of the heartbeat file (rejected: a machine that slept reads as dead).
- **Limits**: not usable on a network file system. The control root is in the user's state directory, which is local by default; the doctor warns when the control root is on a network file system. `unverified` on macOS.

### D-3 The liveness endpoint lies at a short path

- **Decision**: the socket lies in a private directory directly under the runtime directory of the user, or under the temporary directory of the system when there is none, named by the first 16 hexadecimal characters of the workspace identity. The owner record holds its path. The provider refuses, with `unknown`, a path of more than 100 bytes.
- **Rationale**: R15v B-9 and open question 5: the limit was "about 104 bytes on macOS and 108 on Linux, from general knowledge, not measured. A task measures it." T009 has now measured it.
- **Measured (T009, 2026-10-02)**: on **Linux** the limit is **108 bytes**: a socket path of up to and including 108 bytes is created where it was asked for. Measured by `packages/runtime/test/characterization/socket-path-limit.test.ts`, which walks the length upwards inside a short scratch directory and reads the answer from the file system rather than from the return of `listen`. On **macOS** the value is **`unverified`**, reason: **no macOS machine** exists in this lane (the owner's out-of-band ruling of 2026-09-30); the macOS case of that test is a skip with that reason, and the figure of about 104 bytes stays what it was — general knowledge, not a measurement. Recorded in `specs/122-detached-runtime/verification-record.md`.
- **What the measurement added to this decision**: past the limit the failure is **silent**, which this decision did not know when it was written. `listen` reports success, `connect` reports success, and yet no socket exists at the path that was asked for: the platform **truncates** the path to the limit and binds there. Two endpoints whose paths are both over the limit and agree on their first 108 bytes are therefore **one endpoint** — the second `listen` is refused with `EADDRINUSE`, and a connection to either reaches the first owner. Had those been two workspaces, one run's liveness would have answered for another's and the probe would have said `held-live` about an owner that is not there. So the length MUST be checked before the bind: the platform will not report it. The guard of this decision — refuse a path of more than **100 bytes** with `unknown` — is sound on Linux with 8 bytes of margin, and a path of exactly 100 bytes was shown to bind.
- **Alternatives considered**: the socket inside the lock directory (rejected: the path grows with the control root).

### D-4 Reclaim: one atomic rename of the stale directory

- **Decision**: a contender that probed `stale-owner-dead` renames the stale lock directory to a unique name. Only one rename succeeds. The winner then acquires as in D-1 and removes the renamed directory and the stale socket file. A loser gets `lost-race`.
- **Rationale**: R2v: remove-then-create gave several winners in 297 of 300 rounds; a rename has one winner.
- **Alternatives considered**: remove and create (rejected); a second lock around the reclaim (rejected: it needs the same guarantee again).

### D-5 Owner-dead-group-alive: from the process registry

- **Decision**: after the liveness says the owner is dead, the prober reads the open entries of class `owned` of the process registry and applies the identity check of D-8 to each. Any live entry gives `owner-dead-group-alive`. Entries of class `adoptable` are skipped.
- **Rationale**: R2v risk 3; R15v P-2.

### D-6 Identity of the boot, of the host and of the pid namespace

- **Decision**: Linux: the boot identifier of the kernel, the host name, and the identity of the pid namespace of the process. macOS: the boot time of the kernel from `sysctl`, the host name, and null for the pid namespace. All macOS values are `unverified`.
- **Rationale**: R2v risks 4, 7 and 8.

### D-7 Starting the runtime root

- **Decision**: `spawn-detached` starts the runtime entry with the process API of the runtime platform in detached mode, which makes the child the leader of a new process session; standard input is the null device, standard output and standard error are the opened runtime log; the parent drops its reference and exits. No shell is interposed. `foreground` prints the command line of the runtime entry with the launch id and waits for the handshake while the consumer runs it in a terminal of their own.
- **Rationale**: R15 A-7.3; R2v ("Node cannot make itself a session leader; it must be spawned detached by a parent"). Whether the child survives the end of a host session is `unverified` and is what the spike tests.
- **Alternatives considered**: a service manager of the operating system (roadmap: it is the strategy that survives a reboot); a shell wrapper with `nohup` or `setsid` (rejected: a second language, and `setsid` is absent on macOS).

### D-8 Identity check and the process table

- **Decision**: start time on Linux from the process file system (ticks since boot, compared together with the boot identity); on macOS from `ps`, run with the locale `C`. The run token of a process is read from the environment of the process: on Linux from the process file system, on macOS from `ps` with the environment shown, which works for processes of the same user. The search for survivors lists the processes of the user and reads the environment of each.
- **Rationale**: R11 T-26; R29v PU-90; R1 B5 (the stop primitives of Lisa walk children through the process file system only, so a macOS walk is added).
- **Open**: reading the environment of another process on macOS is `unverified` and may be refused by the system for some processes. The fallback is the registry entry with pid and start time, and a doctor warning that the search is incomplete.

### D-9 The run token

- **Decision**: 32 bytes from the secure random source, minted by the CLI at the first launch of a run and handed to the runtime root in its environment; a `resume` mints a new one for the new launch and the old hash stays in the closed registry entries, so survivors of the old launch are found by the old hash.
- **Rationale**: the token must not be on disk (F122-FR-024). A new token per launch keeps a survivor from being mistaken for a process of the new launch.
- **Note**: to find a survivor by the hash, the search hashes the token found in the environment of each candidate process and compares hashes.

### D-10 Handshake limit, heartbeat and grace

- **Decision**: 30 s, 10 s, 30 s. `validUntil` is the heartbeat plus the grace.
- **Rationale**: no source gives a value (CQ-138). The Node start of 62 to 83 ms (R17) and the launch checks are far below 30 s; a heartbeat every 10 s costs one small write.

### D-11 The state archive

- **Decision**: one file: a compressed JSON document with a manifest (feature slug, workspace identity, product version, creation time, hash of every member) and the members (approval records, ledger records, learning log, approval key, ledger key), followed by a signature over the manifest made with the approval key. Compression comes from the runtime platform.
- **Rationale**: no archive library is needed; the members are text records. The reading on keys is CQ-139.
- **Alternatives considered**: a tar archive (rejected: needs a dependency or a platform tool); an archive without keys (rejected for now: the imported approval records could not be verified by `resume` on the new machine).

### D-12 Adopt moves, export and import copy

- **Decision**: `state adopt --from <old path>` derives the old workspace identity from the path text, without needing the path to exist, and renames the state of the feature into the new control plane. Across file systems it copies, verifies the hashes, and then removes the source.
- **Rationale**: F100-FR-032: no mutable file is shared between two workspaces.

### D-13 The control root cannot be written

- **Decision**: the CLI writes and removes a probe file in the control root before the launch record; the runtime root does the same before the lock. The fallback is a control root the consumer sets (`state.controlRoot`, a widening key). Nothing falls back by itself.
- **Rationale**: R15v A-7, P-6; feature 100 annex H §H.1, capability `stateRootWritable`.

### D-14 The spike

- **Decision**: the spike is a small driver that starts a stand-in for the runtime root (it takes no lock of the product; it writes a line to its log every second and tries to write a file in the control root). Cases: platform (Linux, macOS) × session (interactive, headless) × shell sandbox (off, on) × how the session ends (exit, kill), which gives 16. Per case three observations: the root lives after 60 s, the host's shell tool wrote the control root, the detached root wrote it after the end of the session. The headless cases start a host session and therefore a model call: they are **paid** and must be logged; they are not run by the agent that writes this specification.
- **Rationale**: `architecture.md` section 4; R3 risk 1; R15v P-6. The spec counts eight cases per platform.

## Open points carried to tasks

| Point | Task |
|---|---|
| Path length limits of a local socket, measured on both platforms | Measurement task in the foundation phase |
| macOS: start time, boot identity, environment of another process | Platform tasks, `unverified` until a runner exists |
| Detach survival inside a host session | The spike |
