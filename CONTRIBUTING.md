# Contributing

```bash
npm ci --ignore-scripts
npm run typecheck:src
npm run lint
npm run format:check
npm run check:imports
npm test
npm run test:e2e
```

`npm run test:e2e` builds the Claude Code plugin from this tree and takes a feature through it with a stub of
`claude`, so it needs no account and spends nothing. Please add a test with each change, keep the layering
(`npm run check:imports` fails a layer that imports from above it), and run `npm run format` before you push.

The run path starts at `packages/cli/src/engine/run-feature.ts`, which wires the real parts together. Shared
interfaces live in `packages/contracts`; a change there is a change for every host.

Pull requests merge by squash once `lint`, `test` and `no-session-links` are green. Label a pull request
`do-not-merge` to hold it.

This public suite holds the tests that stand alone. Tests bound to the project's internal spec documents run in
the maintainer's private tree.
