# Publishing the core packages

How the four published packages of `specstride-core` are packed, versioned and — by the
owner, never by this repository's automation alone — published to npm. Nothing here runs
`npm publish`, `npm login`, or touches a registry: rule 4 of the split holds that the owner
publishes.

## The four packages

The published set is the `published` key of `packages/contracts/data/package-graph.json`:

| Package | Holds | Staged by |
|---|---|---|
| `specstride` | the CLI bundle: one ESM file, zero runtime dependencies, `bin` `specstride` | `packages/cli/scripts/pack.mjs` |
| `@specstride/contracts` | the contracts layer (built JavaScript + `.d.ts`), with the data files it reads at run time (the host capabilities, the package graph) | `scripts/build-package.mjs` |
| `@specstride/host-kit` | the host-neutral kit: the skill sources and registry, the generic render, the shim core, the doctor check set, the eval utilities (built JavaScript + `.d.ts`); its only dependency is `@specstride/contracts` | `scripts/build-package.mjs` |
| `@specstride/testkit` | the subset a host needs: the EP-01 conformance suite, its fixtures, the built-in plain-shell sample, and the release-condition rule a host judges its own live-run entry row against (`@specstride/testkit/release/conditions`; see `packages/testkit/staging.json`) | `scripts/build-package.mjs` |

Every package that crosses a repository boundary ships built JavaScript plus declarations,
never `.ts` source: Node does not strip types under `node_modules`. The workspace source
manifests keep version `0.0.0` and `exports` rows that point at `.ts`; they are never what a
version publishes — the staged trees under `.build/pack/` are.

## How to pack

From the repository root, on a clean tree:

```
node scripts/pack-release.mjs
```

The corpus under `specs/` is git-ignored, so a fresh clone or worktree copies it before
packing. At minimum it needs
`specs/100-specstride/contracts/extension-points/{index.json,EP-01.host.json}`, which the
testkit staging fixtures name; without them the packer refuses.

The packer stages all four (the CLI bundle first, then the three `@specstride` packages),
guards what was staged, and packs into `.build/release/`, printing one line per package:

```
released @specstride/contracts@0.1.0 sha256-<64 hex> specstride-contracts-0.1.0.tgz
```

It writes the same facts (name, version, file, sha256) as `.build/release/release.json`,
which the publish job of `.github/workflows/release.yml` and a plugin repository's pin
script read. The guards, in order:

- the root manifest's `version` must be a release version (`X.Y.Z`);
- every staged manifest's `version` must equal that constant, and no staged manifest may
  define a `scripts` field — no install script ships (a writer that mis-stages stops the
  pack before anything is packed);
- the release directory is emptied on every run and must hold nothing but the four tarballs
  and the sidecar.

`.build/` stays git-ignored: the tarballs and the sidecar are build artifacts. To check a
pack without publishing anything, `npm run test:release` installs the four tarballs with
`npm install --ignore-scripts` into a temporary directory outside the repository
(`tests/release/installable-packages.test.ts`) and holds the installed tree against: the
bundled CLI answering `--protocol` with `CLI_PROTOCOL_VERSION`; host-kit rendering the run
skill through the plain spelling with the same body as inside the repository; `tsc
--noEmit` over the installed declarations; the EP-01 suite passing against the plain-shell
sample from the installed testkit; and no installed package carrying an install script.

## The version rule

**One version for all four.** The constant is the `version` of the root `package.json`
(`0.1.0` at the start of the split). Each staged manifest carries it, and each staged
manifest pins its sibling core packages at exactly that version — no range, no caret. A
release bumps the root manifest's version once; nothing else is edited.

A plugin depends on core's packages **at that exact version**: `"@specstride/host-kit":
"0.1.0"` in the plugin's manifest, installed from the pinned tarballs, and on nothing else
of core. A plugin takes a new core by changing the one pinned version and running its own
gate.

**The CLI protocol integer guards run-time incompatibility.** The exact version pin holds
the packages together at install time; between builds it is `CLI_PROTOCOL_VERSION` (in
`@specstride/contracts/src/ep/host`, `1` today) that decides whether a host may drive a
CLI: the bundled CLI answers `specstride --protocol` with the integer it was built from,
and a host compares it before it drives the CLI and refuses on a mismatch. The shim inlines
the integer it checks, so a plugin built against one protocol does not silently drive a CLI
of another.

## The owner's steps (not run here)

This repository, its scripts and its workflows never log in, never create the organization,
and never publish. The owner, and only the owner:

1. `npm login` under the owner's own account. This development host has no npm login and
   must not gain one.
2. Create the npm organization `specstride` (the scope of the three `@specstride`
   packages; the unscoped `specstride` does not need it, but the organization name should
   be held by the owner all the same).
3. Re-check that the names are still free: `specstride`, `@specstride/contracts`,
   `@specstride/host-kit`, `@specstride/testkit` were unregistered when checked on
   **2026-11-06**; that says nothing about the day of publishing.
4. Publish from the protected branch through `.github/workflows/release.yml`
   (`workflow_dispatch`, manual only) once GitHub Actions minutes return. The workflow runs
   the release-conditions job first — parity, the canary run with the real redactor, and
   the entry of the logged live run T205 for the build being published — and publishes
   nothing when any of them fails. Its publish job runs `node scripts/pack-release.mjs`,
   then `npm publish --provenance --access public` over the tarballs of the sidecar, and
   checks the attestations of what it published. The provenance attestation binds each
   package to the commit and to the run, which is why publishing happens from the workflow
   on the protected branch and not from a laptop.

No `git push` happens from this repository either: merging into the monorepo's `main` and
any later hosting decision on GitHub are the owner's, made locally.
