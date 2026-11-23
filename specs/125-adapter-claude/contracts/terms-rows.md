# Terms rows supplied by the adapter (F125-FR-005, F125-FR-037)

Data for the terms gate of feature 100 (annex C §C.12). Feature 147 owns the terms gate, its file and the evaluator; this
adapter supplies the facts. Every row rests on documentation only: `unverified`, access date 2026-09-29
(R8v), re-read every 30 days (ruling 59).

| Provider | Auth tier | Audience | Transport | Status | Basis |
|---|---|---|---|---|---|
| `anthropic` | 1 | `personal` | `subprocess` | `allowed` | An end user signing in to the unmodified Claude Code binary with their own subscription; a one-year token from `claude setup-token` for scripts |
| `anthropic` | 1 | `distributed` | `subprocess` | `personal-only` | Third parties may not offer claude web login or its rate limits in their products unless approved; the carve-out is confirmed for personal use only. Opt-in, marked "personal use only", with a warning |
| `anthropic` | 2 | `personal` | `subprocess`, `direct-call`, `sdk-in-process` | `allowed` | Products that interact with Claude, the Agent SDK included, use API key authentication |
| `anthropic` | 2 | `distributed` | `subprocess`, `direct-call`, `sdk-in-process` | `allowed` | as above |
| `anthropic` | 3 | any | any | `refused` | OAuth is for purchasers of the plans and ordinary use of native applications; credentials or session tokens are not to be collected or intermediated |
| `anthropic` | 1 | any | `sdk-in-process` | `refused` | The SDK never carries a subscription login (ruling 70) |

The audience `distributed` defaults to auth tier 2. The quoted sentences, sources and access dates live in the
data file, from `research/R8v-terms-verification.md` rows 1 to 6.

Open point reported to the orchestrator: R8v says the provider's pages do not draw the line between
`claude -p` and the SDK library that the owner's ruling 70 draws. The rows above follow the ruling, which
is stated in terms of the credential (R8v open question 2).
