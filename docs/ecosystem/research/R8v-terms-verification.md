# R8v — terms matrix verification

Verifier: R8v. Access date for every URL below: **2026-09-29**. Object checked:
`/root/specstride-claude/docs/ecosystem/research/R8-subscription-terms-matrix.md`.
Constraining decisions: 6 (tiered auth, terms gate), 17 (discovery, unknown terms), 19 (personal and distributed).

## Method

1. Read `BRIEF-COMMON.md` and decisions 6, 17, 19. No credential file, token store or keychain entry was read. No CLI was run. No paid model call was made. No subagent was used.
2. Every provider page was downloaded **raw** with `curl -sL` into `/tmp/specstride-research/R8v/` and converted to text locally with a tag stripper (no summarising model in the path). Documentation sites that serve markdown (`code.claude.com`, `learn.chatgpt.com`, `docs.z.ai`, `raw.githubusercontent.com`) were read as markdown. Each sentence R8 quotes was searched for with `grep` in that text and read in context.
3. For each cell that says or implies allowed / explicit / documented / conditional I looked for text on the provider's own pages that contradicts it, including pages R8 did not read.
4. Pages R8 could not read:
   - OpenAI Terms of Use: the live page still returns HTTP 403 to curl (`openai.com/policies/row-terms-of-use/` and `/policies/terms-of-use/`). Read instead from the Internet Archive capture of the official page, captures dated 2026-09-27 and 2026-09-28. This is a copy of the provider's page held by a third party, not the provider's server; it is marked `archive` below.
   - OpenAI Services Agreement (capture 2026-09-26), OpenAI Service Terms (capture 2026-07-31) and the OpenAI help article "Using Codex with your ChatGPT plan" (capture 2026-09-22): same route, same mark.
   - Gemini API Additional Terms: a plain request is redirected to a Google sign-in; the page is served with a cookie jar enabled (`curl -c/-b`). Read live.
5. Pages R8 did not read that I added: Z.ai subscription terms (`docs.z.ai/legal-agreement/subscription-terms`), which contain the Coding Plan "Usage Rules" that R8's S31 only links to.
6. Disagreement rule applied as instructed: a cell that cannot be confirmed from the provider's own page becomes **not allowed until the owner rules**. Where the provider text supports the use but adds conditions R8 did not state, the cell is downgraded to `CONDITIONAL` and stays usable.
7. Tags: every row in the results table is `verified-doc` (URL and date given) unless marked otherwise.

Not re-checked, because they contain no "allowed" claim: the dsh, prime and unknown-provider rows (`SILENT` / decision 17), and all `N/A` cells.

## Cell-by-cell results

Audience A = personal tool used by the account holder. B = distributed MIT product used by third parties on their own accounts.

| # | Provider | Tier | Aud. | R8's cell | Verdict | Quoted sentence (as found in the raw page) | URL | Access |
|---|---|---|---|---|---|---|---|---|
| 1 | Anthropic | 1 | A | `ALLOWED-EXPLICIT` | **confirmed** | "Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription"; "For CI pipelines, scripts, or other environments where interactive browser login isn't available, generate a one-year OAuth token with `claude setup-token`"; "This token authenticates with your Claude subscription"; consumer terms exception: "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise." | code.claude.com/docs/en/legal-and-compliance ; /authentication ; anthropic.com/legal/consumer-terms | 2026-09-29 |
| 2 | Anthropic | 1 | B | `CONDITIONAL` | **downgraded → NOT-ALLOWED until the owner rules** | For: the carve-out in row 1 and "preinstalling or running Claude Code in your products or services (e.g. in hosted sandboxes or other agent infrastructure) requires agreeing to our Commercial Terms of Service and complying with the conditions below". Against: "Unless previously approved, Anthropic does not allow third party developers to offer claude web login or rate limits for their products, including agents built on the Claude Agent SDK." and the headless page: "This page covers using the Agent SDK via the CLI (`claude -p`)." | code.claude.com/docs/en/legal-and-compliance ; /agent-sdk/overview ; /headless | 2026-09-29 |
| 3 | Anthropic | 2 | A | `ALLOWED-EXPLICIT` | **confirmed** | "Developers building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication through Claude Console or a supported cloud provider." | code.claude.com/docs/en/legal-and-compliance | 2026-09-29 |
| 4 | Anthropic | 2 | B | `ALLOWED-EXPLICIT` | **confirmed** | "A.1. Overview. Subject to these Terms, Anthropic gives Customer permission to use the Services, including to power products and services Customer makes available to its own customers and end users". Limit: "D.4 ... resell the Services except as expressly approved by Anthropic". | anthropic.com/legal/commercial-terms (effective 2025-06-17) | 2026-09-29 |
| 5 | Anthropic | 3 | A | `NOT-ALLOWED` | **confirmed** | "OAuth authentication is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications." | code.claude.com/docs/en/legal-and-compliance | 2026-09-29 |
| 6 | Anthropic | 3 | B | `NOT-ALLOWED` | **confirmed** | "developers may not collect, store, or intermediate Claude's web app credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow." | same | 2026-09-29 |
| 7 | OpenAI | 1 | A | `ALLOWED-DOCUMENTED` | **downgraded → CONDITIONAL** (still usable) | For: "`codex exec` reuses saved CLI authentication by default"; the advanced path exists for "users who need ChatGPT/Codex rate limits instead of API key usage". Against: "Use API key authentication for programmatic Codex CLI workflows, such as CI/CD jobs. Don't expose Codex execution in untrusted or public environments."; "API keys are still the recommended default for automation."; Terms of Use: "Automatically or programmatically extract data or Output (defined below)." with no carve-out. | learn.chatgpt.com/docs/auth ; /docs/non-interactive-mode.md ; openai.com/policies/row-terms-of-use (archive) | 2026-09-29 |
| 8 | OpenAI | 1 | B | `ALLOWED-DOCUMENTED` (own workstation) | **downgraded → NOT-ALLOWED as a default until the owner rules**; consumer opt-in only | Same sentences as row 7, plus "Do not use this workflow for public or open-source repositories." | same | 2026-09-29 |
| 9 | OpenAI | 2 | A | `ALLOWED-DOCUMENTED` | **confirmed** | "Sign in with an API key for usage-based access"; "You can use `CODEX_API_KEY` with `codex exec`, `codex review`, the TypeScript SDK, and `codex exec-server --remote`." | learn.chatgpt.com/docs/auth ; /docs/non-interactive-mode.md | 2026-09-29 |
| 10 | OpenAI | 2 | B | `ALLOWED-DOCUMENTED`, Services Agreement unread | **confirmed** (agreement now read) | "2.2. Use. OpenAI grants Customer a non-exclusive right to access and use the Services during the Term. This includes the right to use OpenAI's API to integrate the Services into Customer Applications and to make Customer Applications available to End Users." | openai.com/policies/services-agreement (archive; effective 2026-01-01) | 2026-09-29 |
| 11 | OpenAI | 3 | A | `NOT-ALLOWED` | **confirmed** | No OpenAI page grants it. Terms of Use: "You may not share your account credentials or make your account available to anyone else". The only "explicitly supports" sentence is on a third party's page (docs.openclaw.ai/providers/openai, line found). | openai.com/policies/row-terms-of-use (archive) | 2026-09-29 |
| 12 | OpenAI | 3 | B | `NOT-ALLOWED` | **confirmed** | same | same | 2026-09-29 |
| 13 | Google | 1 | A | `NOT-ALLOWED` consumer; `ALLOWED-DOCUMENTED` Standard/Enterprise | **confirmed** | "Starting June 18, 2026, Gemini Code Assist IDE extensions stopped serving requests for the Gemini Code Assist for individuals, Google AI Pro, and Google AI Ultra tiers. This also applies to usage of Gemini CLI. As part of the deprecation, you can no longer use the Login with Google option to access the IDE extensions or Gemini CLI."; "No, access to Gemini Code Assist IDE extensions and Gemini CLI using Gemini Code Assist Standard or Enterprise subscriptions remain unchanged."; "Headless mode will use your existing authentication method, if an existing authentication credential is cached." | developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals ; geminicli.com/docs/get-started/authentication/ | 2026-09-29 |
| 14 | Google | 1 | B | same as A | **confirmed** | same | same | 2026-09-29 |
| 15 | Google | 2 | A | `ALLOWED-EXPLICIT` | **confirmed** | "Set the GEMINI_API_KEY environment variable to your key."; API terms: the service is for developers building "for professional or business purposes, not for consumer use." | geminicli.com/docs/get-started/authentication/ ; ai.google.dev/gemini-api/terms (effective 2026-03-23) | 2026-09-29 |
| 16 | Google | 2 | B | `ALLOWED-EXPLICIT` | **confirmed** | "You may only access the Services (or make API Clients available to users) within ..." (the terms contemplate API Clients made available to users); "You may not use the Services to develop models that compete with the Services". | ai.google.dev/gemini-api/terms | 2026-09-29 |
| 17 | Google | 3 | A | `NOT-ALLOWED` | **confirmed** | "Directly accessing the services powering Gemini CLI (for example, the Gemini Code Assist service) using third-party software, tools, or services (for example, using OpenClaw with Gemini CLI OAuth) is a violation of applicable terms and policies. Such actions may be grounds for suspension or termination of your account." | geminicli.com/docs/resources/tos-privacy/ | 2026-09-29 |
| 18 | Google | 3 | B | `NOT-ALLOWED` | **confirmed** | same | same | 2026-09-29 |
| 19 | GitHub Copilot | 1 | A | `ALLOWED-EXPLICIT` | **confirmed** | "This allows you to use Copilot directly from the terminal, but also allows you to use the CLI programmatically in scripts, CI/CD pipelines, and automation workflows."; "Each time you interact with Copilot in Copilot CLI's interactive interface, or use Copilot CLI programmatically, AI credits are consumed based on the number of tokens processed." | docs.github.com/en/copilot/how-tos/copilot-cli/automate-copilot-cli/run-cli-programmatically ; /concepts/agents/copilot-cli/about-copilot-cli | 2026-09-29 |
| 20 | GitHub Copilot | 1 | B | `ALLOWED-DOCUMENTED` | **confirmed** | Same sentences; the consumer is the actor. Limits: "Your login may only be used by one person"; "Abuse or excessively frequent requests to GitHub via the API may result in the temporary or permanent suspension of your Account's access to the API." | same ; docs.github.com/en/site-policy/github-terms/github-terms-of-service (effective 2026-04-27) | 2026-09-29 |
| 21 | GitHub Copilot | 2 | A | `ALLOWED-EXPLICIT` | **confirmed** | "Environment variables: Recommended for CI/CD pipelines, containers, and non-interactive environments. You set a supported token as an environment variable (COPILOT_GITHUB_TOKEN, GH_TOKEN, or GITHUB_TOKEN)"; "The Copilot Requests permission is only available on user-owned fine-grained personal access tokens." | docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli | 2026-09-29 |
| 22 | GitHub Copilot | 2 | B | `ALLOWED-EXPLICIT` | **confirmed** | "Each user authenticates with their own GitHub account"; "Copilot usage is billed to each user's subscription"; "Important: Your application is responsible for token storage, refresh, and expiration handling." | docs.github.com/en/copilot/how-tos/copilot-sdk/setup/github-oauth (R8's URL redirects here) | 2026-09-29 |
| 23 | GitHub Copilot | 3 | A | `NOT-ALLOWED` | **confirmed** | "GitHub Copilot now fully supports authentication with OpenCode through a formal partnership" — a grant to one named tool, none general. | github.blog/changelog/2026-01-16-github-copilot-now-supports-opencode/ | 2026-09-29 |
| 24 | GitHub Copilot | 3 | B | `NOT-ALLOWED` | **confirmed** | same | same | 2026-09-29 |
| 25 | OpenRouter | 2 | A | `ALLOWED-EXPLICIT` | **confirmed** | "You are responsible for maintaining the confidentiality and security of all API keys, tokens, passwords, and other credentials used to access the Service" | openrouter.ai/terms (last updated 2026-08-31) | 2026-09-29 |
| 26 | OpenRouter | 2 | B | `ALLOWED-EXPLICIT` | **confirmed** | "the Service enables you, your Authorized Users, and your customers (to the extent you incorporate the Service into your own products and services) access to Models"; prohibited: "access the Site or Service for purposes of reselling API access to Models or otherwise developing a competing service"; PKCE: "Connect your users to OpenRouter", "Exchange the code for a user-controlled API key". | openrouter.ai/terms ; openrouter.ai/docs/guides/overview/auth/oauth | 2026-09-29 |
| 27 | z.ai | 1 | A | `ALLOWED-EXPLICIT` (Coding Plan through a listed tool) | **downgraded → CONDITIONAL** (still usable) | For: "GLM Coding Plan may only be used within officially supported tools and products" and the list names Claude Code, Codex, OpenCode, Pi, Cline, Goose, OpenClaw. Conditions R8 did not read: "If the system detects usage through unauthorized or unsupported tools (such as SDK-based access or other third-party integrations), some subscription benefits may be restricted"; "licensed only to the individual natural person associated with such account". | docs.z.ai/devpack/usage-policy ; /devpack/tool/others ; /legal-agreement/subscription-terms | 2026-09-29 |
| 28 | z.ai | 1 | B | same as A | **downgraded → NOT-ALLOWED as a default until the owner rules** | "users may not use their subscription benefits for tools or scenarios outside of this scope"; "If Z.ai reasonably suspects that you are engaging in account sharing, bulk or automated usage on behalf of others, resale of access, or any other conduct that may harm the platform's fair-use order ... Z.ai is entitled to take measures including ... suspending or terminating the service". | docs.z.ai/devpack/tool/others ; /legal-agreement/subscription-terms | 2026-09-29 |
| 29 | z.ai | 2 | A | `ALLOWED-EXPLICIT` (pay-as-you-go API); `NOT-ALLOWED` (Coding Plan key from a Specstride adapter) | **confirmed**, both halves | "We grant you a non-exclusive right to access and use the API Services during the valid term, which includes the right to use Z.ai's API to integrate the Services into your applications or to develop downstream systems, applications or functions to your end users". Prohibition: "You shall not use the GLM Coding Plan quota for general-purpose API access or any scenarios outside such tools, including but not limited to directly invoking model APIs from your own applications, bots, websites, SaaS products or other systems". | docs.z.ai/legal-agreement/terms-of-use ; /legal-agreement/subscription-terms | 2026-09-29 |
| 30 | z.ai | 2 | B | same as A | **confirmed** | "You are solely responsible for the systems, applications, or functions developed by using API Services." | docs.z.ai/legal-agreement/terms-of-use | 2026-09-29 |
| 31 | z.ai | 3 | A | `NOT-ALLOWED` | **confirmed** | "Account sharing or multi-user access is prohibited."; "Accounts with more than three violations may be banned." | docs.z.ai/devpack/usage-policy | 2026-09-29 |
| 32 | z.ai | 3 | B | `NOT-ALLOWED` | **confirmed** | "you may not resell, sub-resell, repackage, aggregate, proxy or otherwise provide the GLM Coding Plan to any third party, whether on a paid or free basis" | docs.z.ai/legal-agreement/subscription-terms | 2026-09-29 |
| 33 | opencode | 1 | A | `ALLOWED-DOCUMENTED`, gated by back end | **confirmed**; inherits the downgrades of its back end | "There are plugins that allow you to use your Claude Pro/Max models with OpenCode. Anthropic explicitly prohibits this."; hosted service terms: "You will only use the Services for your own internal use, and not on behalf of or for the benefit of any third party"; "automatically or programmatically extracts data or Output". | opencode.ai/docs/providers/ ; opencode.ai/legal/terms-of-service (effective 2026-08-15) | 2026-09-29 |
| 34 | opencode | 1 | B | same | **confirmed**; same inheritance | same | same | 2026-09-29 |
| 35 | opencode | 3 | A | `NOT-ALLOWED` except a provider-named back end | **confirmed** | GitHub names OpenCode (row 23); the permitted client is opencode, not Specstride. | github.blog changelog 2026-01-16 | 2026-09-29 |
| 36 | opencode | 3 | B | `NOT-ALLOWED` | **confirmed** | same | same | 2026-09-29 |
| 37 | pi | 1 | A | `ALLOWED-DOCUMENTED` (API-key back ends) | **confirmed** | "For a built-in AI provider, run `/login` inside Pi to connect a subscription or API key."; "`auth.json` can contain API keys and OAuth tokens. Keep it private and do not commit it."; licence line "MIT". | raw.githubusercontent.com/badlogic/pi-mono/main/packages/coding-agent/README.md ; .../docs/providers.md | 2026-09-29 |
| 38 | pi | 1 | B | same | **confirmed** | same | same | 2026-09-29 |
| 39 | pi | 3 | A | `NOT-ALLOWED` | **confirmed** | pi's `/login` OAuth is R8's mechanism M3; it inherits rows 5, 11, 17. | same | 2026-09-29 |
| 40 | pi | 3 | B | `NOT-ALLOWED` | **confirmed** | same | same | 2026-09-29 |
| 41 | DeepSeek | 2 | A | `ALLOWED-EXPLICIT` | **confirmed** | "Please keep your created API key securely, prevent any form of leakage, do not share or publicly disclose your API key with others, and do not expose it in browser or other client-side code." | cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html (effective 2026-04-29) | 2026-09-29 |
| 42 | DeepSeek | 2 | B | `ALLOWED-EXPLICIT` | **confirmed** | "You can integrate the capabilities of the DeepSeek models into various downstream systems, applications, or functionalities for intended purposes and specific scenarios, providing services to both internal and external end users." | same | 2026-09-29 |

Totals: **42 cells checked, 37 confirmed, 5 downgraded, 0 could-not-read** (three OpenAI pages were read from an archive copy because the live server returns 403).

### Quote fidelity findings

| R8 source | Finding |
|---|---|
| S1–S4 (raw) | Every quoted sentence exists verbatim. |
| S5, S6, S7 | Quotes exist verbatim; effective dates 2025-10-08, 2025-06-17, 2025-09-15 confirmed. |
| S8 | Quote exists verbatim. The page is dated June 16, 2026. The phrase R8 cites, "Third-party apps that authenticate with your Claude subscription through the Agent SDK", sits in the part the page itself marks as "preserved for reference but is no longer taking effect". It describes what a credit would have covered. It is not a grant to developers. R8's handling is right. |
| S9 | The URL slug changed to `...-use-claude-code-with-your-pro-or-max-plan`. The page says nothing about headless or unattended use. |
| S10, S11, S12 | Quotes exist verbatim. R8 omitted the strongest sentence on the auth page: "Use API key authentication for programmatic Codex CLI workflows, such as CI/CD jobs." |
| S13 | R8's second-hand quotes are verbatim in the archived page, and the effective date 2026-01-01 is confirmed ("Published: January 1, 2026", "Effective: January 1, 2026"). |
| S14–S18 | Quotes exist verbatim. S15 and S18 both carry the banner "Unpaid tier and Google One users: Gemini CLI was replaced by Antigravity CLI on June 18th, 2026." The 2026-06-18 date is confirmed on three Google-side pages. |
| S19–S26 | Quotes exist verbatim. S25 now lives at `/copilot-sdk/setup/github-oauth`. The acceptable-use sentence reads "using our servers for any form of excessive automated bulk activity". |
| S27, S28 | Quotes exist verbatim. |
| S29–S33 | Quotes exist verbatim. I did not find the effective date 2026-04-14 that R8 pins for S33 in the markdown version of the page: `unverified` (tried: grep for "effective" and "updated" in the raw markdown). |
| S34, S35 | Quotes exist verbatim. |
| S36 | The README at the cited URL is 2.4 KB and does not contain "35+ providers"; that figure is `unverified` (tried: grep in the README and providers doc). It does not affect a cell. |
| S37 | Quotes exist verbatim; effective date confirmed. |

## Downgraded cells

### D1. Anthropic, Tier 1, audience B — `CONDITIONAL` → **not allowed until the owner rules**

Evidence, all from raw pages:

1. R8 draws a line between the `claude` subprocess (allowed) and the Agent SDK library (not allowed with a subscription login). Anthropic's pages do not draw that line. The headless page is subtitled "Use the Agent SDK to run Claude Code programmatically from the CLI, Python, or TypeScript" and says "This page covers using the Agent SDK via the CLI (`claude -p`)." The help article groups "Claude Agent SDK, `claude -p`, and third-party app usage" together.
2. The Agent SDK overview says: "Unless previously approved, Anthropic does not allow third party developers to offer claude web login or rate limits for their products, including agents built on the Claude Agent SDK." A distributed product whose default is to run on each consumer's subscription limits through `claude -p` can be read as offering those rate limits for the product.
3. The legal page has a carve-out that points the other way (row 2, "Nor does it prevent an end user..."), but it is tied to the section that requires "agreeing to our Commercial Terms of Service". Nothing in the repository material I was given shows the owner has agreed to them for Specstride. This is an `inferred` gap, resting on R8 open question 3.
4. The same page ends: "For questions about permitted authentication methods for your use case, please contact sales." The provider itself treats the case as one to ask about.
5. "Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK." Hours-long unattended loops launched by a product are hard to describe as ordinary.

The two texts pull in different directions and I cannot confirm the cell from the provider's pages. What would restore it: the owner agrees to the Commercial Terms and obtains a written answer from Anthropic that an npm-installed orchestrator spawning the consumer's own unmodified `claude` under the consumer's own login is covered by the carve-out.

Audience A is unaffected: the account holder running their own `claude -p`, including with `setup-token`, has explicit text (row 1).

### D2. OpenAI, Tier 1, audience A — `ALLOWED-DOCUMENTED` → `CONDITIONAL`

The mechanism is documented, and OpenAI names the use case ("users who need ChatGPT/Codex rate limits instead of API key usage"). But OpenAI's own guidance is "Use API key authentication for programmatic Codex CLI workflows", and the Terms of Use list "Automatically or programmatically extract data or Output" among prohibited acts with no exception for Codex. The Terms also require compliance with "any other documentation, guidelines, or policies we make available to you", which is the only bridge between the two. Conditions: the account holder's own trusted machine; no public or open-source CI; the login is never copied by the product; a limit signal is a stop ("circumvent any rate limits or restrictions" is prohibited).

### D3. OpenAI, Tier 1, audience B — `ALLOWED-DOCUMENTED` → **not allowed as a default until the owner rules**

Same evidence as D2. A distributed product that defaults third parties onto the path the provider advises against cannot be confirmed from OpenAI's pages. Proposed handling: Tier 2 is the default for Codex in the distributed audience; ChatGPT-login `codex exec` is a consumer opt-in, off by default and marked, in the way decision 19 treats personal-only items.

### D4. z.ai, Tier 1, audience A — `ALLOWED-EXPLICIT` → `CONDITIONAL`

Use inside a listed tool is explicit. The subscription terms R8 did not read add that the plan is "licensed only to the individual natural person", and name "SDK-based access or other third-party integrations" as unsupported. An orchestrator that drives a listed tool headless is not addressed. Conditions: the listed tool makes every model call; the subscriber is the only user; concurrency stays within the plan's recommendation.

### D5. z.ai, Tier 1, audience B — `ALLOWED-EXPLICIT` → **not allowed as a default until the owner rules**

"tools or scenarios outside of this scope" and "bulk or automated usage on behalf of others" are broad enough that I cannot confirm a distributed orchestrator is inside the scope. The pay-as-you-go API (Tier 2) is unaffected.

## Resulting tier per provider

Corrected matrix. Changes from R8 are in bold.

| Provider | Aud. | Tier 1 | Tier 2 | Tier 3 | Resulting tier |
|---|---|---|---|---|---|
| Anthropic | A | `ALLOWED-EXPLICIT` | `ALLOWED-EXPLICIT` | `NOT-ALLOWED` | 1 (default), 2 |
| Anthropic | B | **`NOT-ALLOWED` until the owner rules (D1)** | `ALLOWED-EXPLICIT` | `NOT-ALLOWED` | **2** |
| OpenAI | A | **`CONDITIONAL` (D2)** | `ALLOWED-DOCUMENTED` | `NOT-ALLOWED` | 1 (conditions), 2 |
| OpenAI | B | **`NOT-ALLOWED` as a default; consumer opt-in (D3)** | `ALLOWED-DOCUMENTED` | `NOT-ALLOWED` | **2** |
| Google (Gemini CLI) | A, B | `NOT-ALLOWED` for consumer accounts; `ALLOWED-DOCUMENTED` for Code Assist Standard/Enterprise | `ALLOWED-EXPLICIT` | `NOT-ALLOWED` | 2 (1 only with Standard/Enterprise) |
| GitHub Copilot | A | `ALLOWED-EXPLICIT` | `ALLOWED-EXPLICIT` | `NOT-ALLOWED` | 1, 2 |
| GitHub Copilot | B | `ALLOWED-DOCUMENTED` | `ALLOWED-EXPLICIT` | `NOT-ALLOWED` | 1, 2 |
| OpenRouter | A, B | `N/A` | `ALLOWED-EXPLICIT` | `N/A` | 2 |
| z.ai | A | **`CONDITIONAL` (D4)**, Coding Plan through a listed harness | `ALLOWED-EXPLICIT` for the API; `NOT-ALLOWED` for a Coding Plan key in a Specstride adapter | `NOT-ALLOWED` | 1 (conditions), 2 (API) |
| z.ai | B | **`NOT-ALLOWED` as a default until the owner rules (D5)** | same as A | `NOT-ALLOWED` | **2 (API)** |
| opencode | A, B | `ALLOWED-DOCUMENTED` for the software; gated by the back end's row **as corrected here**; hosted inference `SILENT` | per back end | `NOT-ALLOWED` | 1, gated by back end |
| pi | A, B | `ALLOWED-DOCUMENTED` with API-key back ends; gated by the back end's row **as corrected here** | per back end | `NOT-ALLOWED` | 1, gated by back end |
| DeepSeek | A, B | `N/A` as a first-party CLI | `ALLOWED-EXPLICIT` | `N/A` | 2 (or 1 through a discovered harness) |
| dsh, prime | A, B | `SILENT` (not re-checked) | per upstream, `unverified` | `N/A` | unchanged: fleet only, unknown terms |
| Unknown provider | A, B | `SILENT` (decision 17) | `SILENT` | `NOT-ALLOWED` | unchanged: 1 or 2 only |

Tier 3: **no provider qualifies.** R8 and R8v agree, so under decision 6 the Tier 3 allowlist ships empty.

## Open questions / risks

1. **`DECISIONS-PENDING` — decision 6 default versus the distributed audience.** Decision 6 makes Tier 1 the default, and Wave 1 is Claude as proposer and critic. After this verification, Tier 1 is confirmed for the distributed audience only for GitHub Copilot and for Gemini CLI with Standard/Enterprise logins. For Claude, Codex and the z.ai Coding Plan it is confirmed for personal use only. Default to proceed on: Tier 1 stays the default in the `personal` audience; the published package runs as `distributed` with Tier 2 as its default for those three providers; Tier 1 for them is an opt-in that is off by default and marked. What changes if the owner rules otherwise: if the owner agrees to Anthropic's Commercial Terms and gets a written answer, D1 returns to `CONDITIONAL` and the distributed default can be Tier 1 for Claude. Decision 6 is not infeasible; its default does not carry over to the second audience unchanged.
2. **`claude -p` is the Agent SDK in Anthropic's own words.** Rule 4 of R8's recommendation ("the adapter is the `claude` subprocess; the Agent SDK library only with an API key") rests on a distinction the provider does not make. The rule should be restated in terms of the credential, not of the packaging.
3. **`--bare` becoming the default for `-p`** is confirmed verbatim ("will become the default for `-p` in a future release"). R8's open question 4 stands.
4. **OpenAI pages were read from an archive.** The live server refuses curl. The captures are one to two days old for the Terms of Use, and two months old for the Service Terms. A human should open the live pages once before the matrix is pinned.
5. **The OpenAI Terms of Use clause on programmatic extraction has no Codex carve-out.** The Service Terms section "Codex and Code Generation" covers only licences on generated code. If OpenAI enforces the clause against subscription automation, D2 falls to not allowed.
6. **Not read by either R8 or R8v:** GitHub Generative AI Services Terms (Copilot Business and Enterprise), Google Cloud terms for Code Assist Standard/Enterprise, Antigravity terms, DeepSeek Terms of Use (the platform terms defer to them for user conduct), OpenRouter's list of Model Terms.
7. **Volatility.** The Anthropic help article changed on 2026-06-15 and promises another change ("When we have an update, we'll share it before anything takes effect"). The 30-day re-check interval R8 proposes is the longest that is defensible.
8. **Unattended use.** No provider page read sets a duration limit on its own CLI. Every one leaves enforcement to its own judgement: Anthropic "without prior notice", GitHub "in our sole discretion", z.ai "reasonably suspects", OpenAI "fair use limits". Account risk under hours-long loops is real at Tier 1 even where the cell is confirmed.
