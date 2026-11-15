# Fixture: inner-check-hangs (spec 153, task T068)

A check manifest of phase 1 with one command: the fake of T004
(`../bin/hang-with-grandchild.mjs`), which forks a grandchild that ignores
SIGTERM and holds both output pipes open, then never exits. The command's
declared `timeoutSec` is **1**.

`manifest.json` is the check manifest of phase 1 in the shape the launch
writes (`specstride.check-manifest/1`), as a **declaration**: the one command
`check-1`, the fake of T004 (`../bin/hang-with-grandchild.mjs`, relative to
this directory), the pid file `pids.txt` and `timeoutSec: 1`. Its `argv[0]`
is the placeholder `<node>` (the Node executable is machine-specific, and a
committed manifest cannot pin an absolute path portably), and `recordHash` is
`canonicalRecordHash(commands)` over that declared form, with `pins` empty.
The consumer test
(`packages/cli/test/engine/loop-speed-limit-micro.test.ts`) resolves
`<node>` to `process.execPath`, the fake and the pid file to absolute paths
inside its own temporary directory, and re-derives `recordHash` and the
executable pin with `writeCheckManifest` — the same call the launch makes —
so nothing here depends on the process working directory and no `pids.txt`
is written into this directory.

