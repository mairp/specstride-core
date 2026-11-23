
## reconcile-2026-11-01
- a) test coverage: uncovered:CT-134-1,CT-134-10,CT-134-101,CT-134-107,CT-134-11,CT-134-12,CT-134-13,CT-134-14,CT-134-15,CT-134-16,CT-134-17,CT-134-18,CT-134-19,CT-134-2,CT-134-20,CT-134-21,CT-134-22,CT-134-23,CT-134-24,CT-134-25,CT-134-26,CT-134-27,CT-134-28,CT-134-29,CT-134-30,CT-134-4,CT-134-5,CT-134-6,CT-134-7,CT-134-8,CT-134-9
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: missing:tasks.md
- e) analyze-report: ok
- notes: tasks.md frontmatter description absent;

## reconcile-2026-11-01 coverage adjudication

Overall verdict: feature 134 was never implemented. `packages/adapter-pi/` exists only as a pre-seeded skeleton — `packages/adapter-pi/src/index.ts:1` is `// @specstride/adapter-pi: skeleton; the owning features (134) fill it. export {}` with no descriptor.json, hooks.ts, doctor.ts, classifier.ts, dialects, or any test directory. `tasks.md:7` itself states CT-134-<n> tests are "Requested", i.e. not yet written. There is no `tests/parity/134/` (parity dirs are 100–109, 142 plus named dirs). The only F134-adjacent code is feature 141's port-side pi stub (`packages/oracle/stubs/lib/harness/pi.ts`, proven F141-FR-010/§O.7) and its stub self-test (`packages/oracle/test/stubs/harness-stubs.test.ts`), which test the stub convention, not any CT-134 behaviour; and `packages/policy/test/captures.md:39` marks the pi capture as "**no**" ("capture 2 of F134-FR-027 is paid and run by feature 134"). All CT-134 ids below are therefore missing for that single reason.

- [CT-134-1] missing: feature 134 unimplemented — packages/adapter-pi/src/index.ts:1 is an empty skeleton; no registry-entry test names pi outside the F141 stub tests.
- [CT-134-2] missing: feature 134 unimplemented — no detection/version-pin characterization test; adapter-pi has no tests dir.
- [CT-134-4] missing: feature 134 unimplemented — no key-by-environment / missing-credential test; descriptor.json never written (tasks.md T018 unchecked).
- [CT-134-5] missing: feature 134 unimplemented — no provider-row decision test; no provider table implemented.
- [CT-134-6] missing: feature 134 unimplemented — no unknown-provider warning test.
- [CT-134-7] missing: feature 134 unimplemented — no Claude-subscription OAuth refusal test; T025 (terms-facts.json, subscription-login hook) unchecked.
- [CT-134-8] missing: feature 134 unimplemented — no no-opt-in refusal test; no consent hook exists (tasks.md T018 unchecked).
- [CT-134-9] missing: feature 134 unimplemented — no opt-in → protection=detect / allow_detect rejection test.
- [CT-134-10] missing: feature 134 unimplemented — no doctor checks implemented (T032 unchecked), so the five-checks test cannot exist.
- [CT-134-11] missing: feature 134 unimplemented — no proposer-invocation characterization; only the F141 convention stub (packages/oracle/stubs/lib/harness/pi.ts) exists.
- [CT-134-12] missing: feature 134 unimplemented — no invocation-record fields test (stdin prompt, cwd, env/tool allow-list).
- [CT-134-13] missing: feature 134 unimplemented — no session-continuation-by-minted-id test.
- [CT-134-14] missing: feature 134 unimplemented — no session-directory cleanup / fresh-session test.
- [CT-134-15] missing: feature 134 unimplemented — no home/overlay rules test.
- [CT-134-16] missing: feature 134 unimplemented — no telemetry-off / customisations-off / native-memory-off default test.
- [CT-134-17] missing: feature 134 unimplemented — no project-local-resources-untrusted test.
- [CT-134-18] missing: feature 134 unimplemented — no full critic flag-set / no-tool-flag test.
- [CT-134-19] missing: feature 134 unimplemented — no toolless-proof test; the proof function (T023) was never written.
- [CT-134-20] missing: feature 134 unimplemented — no critic_not_toolless / exit 3 / no-shared-session-id test.
- [CT-134-21] missing: feature 134 unimplemented — no form tool-less / automatic-pick test.
- [CT-134-22] missing: feature 134 unimplemented — no diversity-window (smaller of the two, no unknown-model default) test.
- [CT-134-23] missing: feature 134 unimplemented — no shared reader test for pi streams; no pi dialect row registered (T028 unchecked); tests/parity/138/c061-critic.test.ts covers prime, not pi.
- [CT-134-24] missing: feature 134 unimplemented — no classifier fixtures; packages/policy/test/classifier-fixtures/manifest.json:42 says "no capture exists; capture 2 of F134-FR-027 is paid and run by feature 134".
- [CT-134-25] missing: feature 134 unimplemented — no terminal-record-decides test.
- [CT-134-26] missing: feature 134 unimplemented — no usage-as-increments / cost-null test.
- [CT-134-27] missing: feature 134 unimplemented — no captures-on-disk test; packages/policy/test/captures.md:39 marks the pi capture as not existing ("**no**").
- [CT-134-28] missing: feature 134 unimplemented — no port-side adapter suite of feature 109 run for pi (tests/parity/109 has no pi case) and no paid-API check for feature 134.
- [CT-134-29] missing: feature 134 unimplemented — no recorded opt-in defaults test.
- [CT-134-30] missing: feature 134 unimplemented — no critic-diversity warning test (T039 unchecked).
- [CT-134-101] missing: feature 134 unimplemented — success-criteria tests T034 unchecked; no one-reader-two-harnesses test.
- [CT-134-107] missing: feature 134 unimplemented — success-criteria tests T034 unchecked; no captures-on-disk success-criteria test.

## reconcile-2026-11-01
- a) test coverage: ok
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: info:no-frontmatter
- e) analyze-report: ok
