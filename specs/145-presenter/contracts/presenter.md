# Contract: presenter, banner, theme (feature 145)

Internal calls, not commands (F100-FR-171). Options are those of the baseline.

| Call | Options | Result record |
|---|---|---|
| presenter | `--mode timeline|card|plain`, `--follow`, `--detail milestones|tools|full`, `--events`, `--workdir`, `--no-color`, `--debug`, `--quiet` | `exit_code` 0; 2 on a usage error |
| banner | `--states`, `--phases`, `--plain`, `--bg`, `--color`, `--no-motion`, `--rail-only`, `--preview`, `--cols`, `--rows` | `exit_code` 0 on every path |
| theme `bg` | — | `dark` or `light`; `exit_code` 1 on any other argument |

Environment (aliases of the keys of rows 70, 71 and 73 to 78 of annex X §X.7, status confirmed; feature 110 owns the spelling): `SPECSTRIDE_LIVE`, `SPECSTRIDE_LIVE_DETAIL`, `SPECSTRIDE_COLOR`, `SPECSTRIDE_MOTION`, `SPECSTRIDE_BANNER`, `SPECSTRIDE_LIVE_RAIL`, `SPECSTRIDE_BANNER_BG`, `SPECSTRIDE_ASCII`; variables of the platform (no key; feature 110 alias table): `NO_COLOR`, `FORCE_COLOR`, `COLORFGBG`, `COLORTERM`, `TERM`, `TMUX`, `STY`, `LC_ALL`, `LC_CTYPE`, `LANG`, `CI`.
