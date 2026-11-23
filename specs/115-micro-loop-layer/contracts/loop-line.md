# The `[LOOP]` line

Grammar: feature 100, annex G §G.3. Keys and values: this feature (F115-FR-038). Printed by the
engine before the digest, on standard output, in default output only, never under the `parity`
profile.

## With the layer on

Keys in this order, pairs `key=value` separated by one space.

| Key | Value |
|---|---|
| `strategy` | `micro` |
| `level` | `L1` |
| `containment` | `C0`, `C1`, `C2` or `C3`: the level in force for the proposer |
| `protection` | The value of the run record (feature 100, annex E §E.2): `prevent` or `detect`; followed by `,basic` when a detected toolchain has no profile (CQ-082) |
| `units` | Units declared in the run |
| `pass` | Units kept |
| `fail` | Units unresolved |
| `unchecked` | Units `unchecked` |
| `tainted` | Checks that carried `tainted` |
| `cycles` | Cycles spent |
| `disengaged` | Phase attempts in which the layer went off |
| `escalations` | Escalations made |
| `failfast-stops` | Jobs stopped by the first-failure predicate; the count is given by the engine, the behaviour belongs to feature 118 |
| `fallback` | `none`, or the fallback reason of a phase attempt that occurred last |

Example:

```text
[LOOP] strategy=micro level=L1 containment=C1 protection=detect units=14 pass=12 fail=1 unchecked=1 tainted=0 cycles=19 disengaged=0 escalations=1 failfast-stops=1 fallback=none
```

## With the layer off by rule

```text
[LOOP] strategy=classic reason=gate-not-executing
```

`reason` is a fallback reason of a run: `gate-not-executing`, `config`, `harness`, `tripwire`.

## With parallel units on

The keys `parallel`, `workers`, `groups`, `group-failures`, `refused` follow, as feature 142
specifies them. This feature prints none of them.

## Status line

The status line carries `strategy=<classic or micro>`. The line itself belongs to the read model.
