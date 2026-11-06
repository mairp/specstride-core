# Publishing the host package for Claude Code

Requirement: F113-FR-042 (control of threat T-43, with F113-FR-019 of T-45).
Release check: F100-FR-236 (CT-100-336) — this feature adds no second
attestation.

## The rule

The Claude Code plugin of Specstride is published only as part of the one
published package. The plugin directory is a build output of this package and
a `files` entry of its manifest, so the one published package carries it and
the release check of F100-FR-236 covers it:

- Published by the build, from the protected branch, with the attestation
  (F100-FR-236). Never from a working copy, never by hand, and never as a
  separate artifact: no publishing step pushes the plugin directory apart from
  the package.
- The marketplace entry is npm-sourced and names the exact package and the
  exact version: `@specstride/host-claude-code@0.0.0`. It never names a range
  (`^`, `~`, `>`, `<`, `*`, `x`, `||`, `latest`), another package, or an
  unstated version.
- This documentation names the same exact package and version:
  `@specstride/host-claude-code@0.0.0`. The test of CT-113-142 holds both this
  file and the marketplace entry against the version of the package manifest,
  so neither can drift from it.

## What the build checks

`src/publishing.ts` of this package holds the rule as code:

- `assertPluginIsPublishedOnlyInsideThePackage` — the plugin directory must be
  a `files` entry of the package manifest, and no declared publishing step may
  push it apart (the build fails otherwise).
- `validateMarketplaceEntryExactness` — an entry that names another package or
  carries a version range fails the build.
- `documentationNamesTheExactPackage` — the documentation must name
  `@specstride/host-claude-code@0.0.0` exactly, with no range form.

The bundling of this package into the one published package is task T064 of
feature 119 (`specs/119-front-door-and-presenter/tasks.md`, review item
W-119-01).
