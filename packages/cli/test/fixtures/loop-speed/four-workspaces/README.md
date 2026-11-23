# Fixture: four workspaces

Four package workspaces, `pkgs/a` to `pkgs/d`, for the scoped in-pass
checks of feature 153 phase 21 (US3). The graph edges are a -> b -> c with
`d` independent of all three: a change under `pkgs/a` selects the commands
of a, b and c (the reverse-dependency closure), never the command of d.
The package graph the engine reads lives at
`packages/contracts/data/package-graph.json`, the path
`graphOfTheRun` reads under the run workdir. The commands document holds one declared command per workspace, cwd set to
the workspace; the `WORKDIR` prefix is replaced with the run workspace by
the test that copies this fixture.
