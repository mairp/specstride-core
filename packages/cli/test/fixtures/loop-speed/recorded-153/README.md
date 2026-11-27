# recorded-153 — the frozen events of feature 153 (F154-SC-009, F154-FR-016)

The engine event files of the whole finished feature 153 run
(`153-loop-feedback-speed`, the workspace
`~/.specstride/workspaces/fbc656c3ba51cb79`, ledger R-M9), copied **read
only**: one `events.jsonl` per engine run under `runs/<runId>/`, 32 run
files, 4 546 events — a finished feature spans many relaunches (R-C17), so
the report must read every run file of the feature in time order
(F154-FR-016; PR #40) and print one report.

The two run files of feature 154 in the same workspace were excluded: the
freeze is feature 153's record only.

- Frozen on: 2026-11-26
- Source: `~/.specstride/workspaces/fbc656c3ba51cb79/runs/<runId>/events.jsonl`
- Files: 32; events: 4 546; bytes: 813 052
- Per-run digest (`<runId> <bytes> <sha256>`, sorted by run id); the whole
  table's SHA-256 is `dee0e78cae7d4c0401132e452b47a3c8f6daf8c41fe883f526cd77226ba14197`:

run-10447578-a363-4aa5-8abc-fccf449c77a7 12842 92d279ea195351584f2fa0feb04e36cb6eebc33ac57c310e520469d758bc4967
run-134d235f-a678-4237-9125-ac2651ca5442 4217 7e7f055a245e633c440113b3ef119807fb620ed5f885b5f70f84b608e0afe148
run-17644e42-aec0-47ed-8800-ee70db1c3d31 10699 2f2ab6851d52a18cea7cc75a04897f27329c4510f3f524790a9ff4c714856243
run-2265d9f5-104f-4ac5-82a9-36e6ca32ded7 123528 348d7a2c6036960c9262c6fc5a417f6ff543588fa5ff54af673e3199fbab23d2
run-235dc818-a768-4b17-8ad6-fe18d2696c3b 3378 99dcef27c810c795becad416c5c7c1c9835a18cec2641767d701a770034fd1f3
run-27285d93-736b-4bbb-97ed-181a1ebf35b8 96854 e5b8c07a1f8241aadc1aca8736159c4d8ab893fb7b31763a02c7e0515aeaba5d
run-30bf3d6e-d0c5-4cbd-9feb-ae02caaf2347 29345 ac3537bf263e9d5f6ec58b3f36e35b4e5af9d0a08d36abee99bc32653de1ef1f
run-3b76f244-1ffb-45be-bdb1-e94f3f48b67f 104425 f054ad3cfffa33819f362b35a00312274a7bef84bd595ac9b6e5041b54fb20f2
run-41581c00-5b0a-46bb-9eed-0d1724a45c3b 42577 58173f309d4f122f2cfeb7a1df5655d861d71204806b6ca1bde17dd91d58c26c
run-45cc1458-ce80-4575-9ce5-597c34463427 3374 15ebf0d62d8121d011eb7b7678cb6802e6bcdca73c0f04029f5dc5e2c14d6a19
run-49e3ea69-93b7-4f8e-8d6f-5dc2118840b8 7698 a54e669e2ea79f1bda87a0b2264a945b3c9c7b82db6d74fedc3064bddd4813ad
run-4a83a1b2-f373-4347-b139-c9f0fdcffd00 11935 aa0fc1906e1d25294485c3d8f9e0bf0f1e033e78e49e38118c28ba789b8e29a9
run-4e42ee42-14d1-4482-b98d-437c807ae9c9 3615 02b30c9f97b81d64fbbc4ca6f0b89947de395ca0f221aa7ae5ca43a63f2ef958
run-4f133983-b787-4bb0-88e9-f249acdf682c 3565 ce0cecc73a6e5b843bff7de9a35b3e24728a3b95defe5a4d25d523dce4e18c28
run-4fe698af-e68a-4609-ad4c-3b88aaececac 182788 b58af86e713291a1be24d3cf715ad8b25da38a5ec9fef4dfdb5eff9b44ce1644
run-58562dad-d9de-4ab9-8899-eca59dad87ea 2695 e9cf0ad9a1ac5d4f74ffa1a0777b2f6cb2f237c5854062e0ea8851e354b010cb
run-5b32566f-5e14-4b4d-b787-1965969c3895 3523 2629940d688ff8eaa6011723e6e225abf4417e9800f1ba184586294c9d30b9ee
run-6938f30b-fe24-47fd-b6c1-e35c9ef266fc 9514 1e3a1dacd22f79149dea0354908950b6b6b8871cbb67cd0896f05c2eb1c6d9bd
run-73607dac-7b98-4e65-b999-32cf3116392f 4330 bb96f0683b642002798a325fd176ca932eb5f03b0ba1ac155a0d7936db09820d
run-74fe8b5c-c84c-4797-a970-5ba7e6e2f4c5 127 d36693f7d07aba1a0b034efd18ede401482b9ad2e55c9b28a045bf8adb205cd9
run-9774b73c-84c0-4955-9e88-827204b67d42 5210 66cc9b50421f6a783b18c15850cd59206d8bd2b278b015bfd0222325060e4da0
run-a0768d88-2b59-4df7-989f-5fb1f3bbe28d 6597 304eb5bb0e0c30a1ff1f6073d6b03780278e4a7f7c198006c47ccf6c0e84aa54
run-b2e1dc9f-cddd-44bd-a914-5213eb356489 3874 ede25913000e4bfbe5c2a3c31b877b3f85373a07fe9db20daa28553b1f852ad1
run-c808d95b-ea9b-444b-9327-05a2dc3abe6a 41032 49ffc84627a1a58de3d0b9c100f89af9aa10ad4293b22fc14faf5ea9ee9b8521
run-d1db8230-2590-4cb0-ba74-fba6a45649fc 44380 abd8ca7e4c12247621255d8410c70ff6c08430c52a4d264a7b8f152310a78684
run-dbc53261-5fea-4ab2-a507-fc5193008020 3920 792ad719200435096e980196fd5d3f19608ce96c87e96811fade63a65c8af42b
run-dc6862f7-f567-4348-a58d-628eb4a7c11e 11937 38dfa6c6b8e59a6edf475806123e83d8fdf169a55dfe7945c233c459ddaa90f0
run-df64d96c-dad9-4e19-87f1-af3e6fa62c53 17505 736a0d6d2c3cd985a673c739f81679d76a6791e3c6af4eb93f6522ff02e3cdec
run-e212060a-4795-48e6-b6b0-e7170d7905a3 4514 c6bb9ae7466f6c918f60047c0ddee9b67189938e2ec3b8ffc2e6c218ef0e8db1
run-e773d813-ddca-4434-886c-a585b0da5d00 4748 d94478107b01fbd0d0a8a0f6e33cb6b10eb586aeb279a353c10b6d4aa3656206
run-ff011b1e-7b55-4234-99df-e3a9b7ffdcca 4344 702c243bb54bd4f513dbb80517435cb5c6589364b003fc9959faf517877bf2a3
run-ffe1e167-ba94-4ddf-8a97-751109b30f46 3962 4aa4ec7ef6a999c72f833cf82d33d2961c21f02bbca6b601ebe6104f0ab09427

## The counts the report must print (F154-SC-009, `expected.json`)

- attempts started: 336
- approvals: 29 (a `phase.ended` of the old vocabulary counts as an approval;
  F154-FR-013)
- phases approved count: 29
- in-pass checks: 386, of which failed: 274
- groups ended `repair`: 28 (every `parallel.group.ended` of the freeze)

`expected.json` holds the full row set the projection prints over the
merged stream, plus `groupsByOutcome`. Nothing writes here: the replay test
compares two runs of `specstride report` over a workspace materialised from
this copy and requires identical bytes and no changed file.
