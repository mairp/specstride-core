# Transports and the optional SDK (F125-FR-034 to F125-FR-038)

## Transports

| Transport | Roles | Auth tiers | Chosen by | Under `parity` |
|---|---|---|---|---|
| `subprocess` | proposer, critic (auth tier 1 only) | 1, 2 | Default | Used |
| `direct-call` | critic | 2 | The critic's transport key, or `parity` | Used: the critic of Claude |
| `sdk-in-process` | proposer, critic | 2 only | The consumer, in user configuration, the environment or a flag | Not used |

Availability (closed set of the spec): `available`, `absent-dependency`, `out-of-range`,
`refused-at-tier`, `not-chosen`.

Selection order in one function, no name test elsewhere: (1) parity forces `subprocess` and the direct
call; (2) an explicit choice of the consumer; (3) the default. A choice of `sdk-in-process` at auth tier 1 is
a configuration error; a choice whose dependency is absent is `unavailable` and the doctor says so.

## How the optional dependency is declared and loaded

| Item | Rule |
|---|---|
| Declaration | Listed under optional peer dependencies of the adapter package, with the peer metadata marking it optional. Never under `dependencies`, `optionalDependencies` or `devDependencies` of the published package |
| Installed by the product | Never. No install script; nothing is compiled at install |
| Bundling | The bundler treats it as external. The build fails if a file of it is in the output |
| Loading | A dynamic import by package name, resolved from the consumer's installation (the workspace of the run first, then the location of the product's entry), inside a function called only when the transport is chosen. Failure to import is `absent-dependency`, not an error of the run |
| Types | None imported at build. The adapter declares a narrow structural type for the one call it uses; tests inject a fake, as Lisa's harness does with `queryImpl` |
| Version range | Tested 0.3.284; range the 0.3 line from the tested version (CQ-148); read from the installed package's own manifest; outside the range is a doctor warning |
| CI check | Pack the package and list its files; install it into a scratch directory with optional peers omitted and list the tree; both listings hold no path under the SDK's package scope and none of its per-platform binary packages. Fails the build |

## Two versions, one pin each

| Component | Pin | verified-on |
|---|---|---|
| Claude Code CLI | 2.1.284, floor 2.1.259 | 2026-09-29 (help and version output; flags), documentation for the rest |
| Agent SDK | 0.3.284, the 0.3 line | 2026-09-29 (type file and documentation; not run) |
