# R8 — Subscription reuse and terms matrix

Access date for every URL in this report: **2026-09-29**. Author: research agent R8.
Constraining decisions: 6 (tiered auth, terms gate), 8 (quotas), 17 (discovery), 19 (personal and distributed).

**Reading guide.** Tier definitions are those of decision 6:

- **Tier 1** — the provider's (or harness vendor's) own, unmodified CLI, logged in by the user, spawned headless as a subprocess. Specstride never sees a credential.
- **Tier 2** — an official SDK or API with a key (or an officially documented token type) supplied by reference (`env:`, `file:`, keychain).
- **Tier 3** — a third-party tool obtains, stores, refreshes or replays a *subscription* OAuth/session token and talks to the provider's backend itself ("openclaw style").

Cell vocabulary (chosen so the adversarial verifier has something precise to attack):

| Status | Meaning |
|---|---|
| `ALLOWED-EXPLICIT` | A provider page says so in words that cover this case. |
| `ALLOWED-DOCUMENTED` | The provider's own docs document this exact usage for the account holder; the terms do not address a third-party orchestrator that merely spawns the CLI. The account holder is the actor. |
| `CONDITIONAL` | Allowed only if stated conditions are met; conditions listed. |
| `SILENT` | No provider text found either way. Treated as **not allowed** for Tier 3 and as "unknown terms" otherwise. |
| `NOT-ALLOWED` | A provider page prohibits it, or it is Tier 3 without explicit support. |
| `N/A` | The mechanism does not exist for this provider. |

**Quote fidelity.** Sources marked `raw` were retrieved as raw markdown and the quotes are exact. Sources marked `relayed` were retrieved through a fetch tool that summarises pages; the quoted sentences are as relayed and the verifier (R8v) must re-read the page before relying on the exact wording. Sources marked `not-retrieved` could not be read (HTTP 403) and every claim resting on them is tagged `unverified`.

---

## Prior art consulted

| File | Use |
|---|---|
| `/root/specstride-claude/docs/ecosystem/research/BRIEF-COMMON.md` (lines 1–122) | Followed: safety rules, template, tags, digest. |
| `/root/specstride-claude/prompts/specstride-ecosystem.md` §0, §1, §2 (lines 9–219), R8 row (line 338), R8v row (line 375), stop rule (line 260) | Decisions 6, 8, 17, 19 taken as decided. |
| `prompts/analysis/A1…A9` | Grepped for "openclaw", "terms of service", "subscription": hits only in A1, A2, A3, A9 and none contains terms research. Nothing reused; nothing contradicted. |
| qmd fleet memory (`mcp__qmd__query`) | Used only to learn what dsh, prime and pi are and that they reach models through a local model gateway with an API key. One search snippet surfaced a redacted key fragment inside an incident note; it was not opened, not followed and is not reproduced. |
| Local CLIs | `command -v`, `--version`, `--help` only (see Version/date pins). No credential file, token store or keychain entry was read. |

Known tension carried forward (prompt lines 210–212): Tiers 1 and 3 are subscription paths that Principle XII restricts; Tier 1 uses the logged-in CLI config while Principle VIII wants a throwaway config home. This report adds evidence to both (F-A6, F-A7) but does not resolve them.

---

## Sources

| ID | Provider page | URL | Fidelity |
|---|---|---|---|
| S1 | Claude Code docs — Legal and compliance | https://code.claude.com/docs/en/legal-and-compliance | raw |
| S2 | Claude Code docs — Authentication | https://code.claude.com/docs/en/authentication | raw |
| S3 | Claude Code docs — Run Claude Code programmatically | https://code.claude.com/docs/en/headless | raw |
| S4 | Claude Code docs — Agent SDK overview | https://code.claude.com/docs/en/agent-sdk/overview | raw |
| S5 | Anthropic Consumer Terms of Service (effective 2025-10-08) | https://www.anthropic.com/legal/consumer-terms | relayed |
| S6 | Anthropic Commercial Terms of Service (effective 2025-06-17) | https://www.anthropic.com/legal/commercial-terms | relayed |
| S7 | Anthropic Usage Policy (effective 2025-09-15) | https://www.anthropic.com/legal/aup | relayed |
| S8 | Claude Help Center — Use the Claude Agent SDK with your Claude plan (update 2026-06-15) | https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan | relayed |
| S9 | Claude Help Center — Using Claude Code with your Pro or Max plan | https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan | relayed |
| S10 | Codex docs — Authentication (developers.openai.com/codex/auth redirects here) | https://learn.chatgpt.com/docs/auth | relayed |
| S11 | Codex docs — Non-interactive mode | https://learn.chatgpt.com/docs/non-interactive-mode.md | relayed |
| S12 | Codex docs — Pricing | https://learn.chatgpt.com/docs/pricing | relayed |
| S13 | OpenAI Terms of Use | https://openai.com/policies/row-terms-of-use/ | **not-retrieved** (HTTP 403 by fetch tool and by curl) |
| S14 | Gemini CLI docs — Terms of service and privacy notice | https://geminicli.com/docs/resources/tos-privacy/ | relayed |
| S15 | Gemini CLI docs — Authentication | https://geminicli.com/docs/get-started/authentication/ | relayed |
| S16 | Google for Developers — Gemini Code Assist consumer accounts (deprecation) | https://developers.google.com/gemini-code-assist/docs/deprecations/code-assist-individuals | relayed |
| S17 | Gemini API Additional Terms of Service (effective 2026-03-23) | https://ai.google.dev/gemini-api/terms | relayed |
| S18 | Gemini CLI docs — Quota and pricing | https://geminicli.com/docs/resources/quota-and-pricing/ | relayed |
| S19 | GitHub Terms of Service (effective 2026-04-27) | https://docs.github.com/en/site-policy/github-terms/github-terms-of-service | relayed |
| S20 | GitHub Terms for Additional Products and Features | https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features | relayed |
| S21 | GitHub Acceptable Use Policies | https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies | relayed |
| S22 | GitHub Docs — Authenticating Copilot CLI | https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli | relayed |
| S23 | GitHub Docs — Running Copilot CLI programmatically | https://docs.github.com/en/copilot/how-tos/copilot-cli/automate-copilot-cli/run-cli-programmatically | relayed |
| S24 | GitHub Docs — About Copilot CLI | https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-copilot-cli | relayed |
| S25 | GitHub Docs — Copilot SDK, GitHub OAuth setup | https://docs.github.com/en/copilot/how-tos/copilot-sdk/set-up-copilot-sdk/github-oauth | relayed |
| S26 | GitHub Changelog 2026-01-16 — GitHub Copilot now supports OpenCode | https://github.blog/changelog/2026-01-16-github-copilot-now-supports-opencode/ | relayed |
| S27 | OpenRouter Terms of Service (last updated 2026-08-31) | https://openrouter.ai/terms | relayed |
| S28 | OpenRouter docs — OAuth PKCE | https://openrouter.ai/docs/guides/overview/auth/oauth | relayed |
| S29 | Z.ai docs — GLM Coding Plan overview | https://docs.z.ai/devpack/overview | relayed |
| S30 | Z.ai docs — GLM Coding Plan FAQ | https://docs.z.ai/devpack/faq | relayed |
| S31 | Z.ai docs — GLM Coding Plan usage policy | https://docs.z.ai/devpack/usage-policy | relayed |
| S32 | Z.ai docs — supported tools | https://docs.z.ai/devpack/tool/others | relayed |
| S33 | Z.ai Terms of Use (effective 2026-04-14) | https://docs.z.ai/legal-agreement/terms-of-use | relayed |
| S34 | opencode docs — Providers | https://opencode.ai/docs/providers/ | relayed |
| S35 | opencode Terms of Service (effective 2026-08-15) | https://opencode.ai/legal/terms-of-service | relayed |
| S36 | pi coding agent — README and providers doc (public repository, MIT) | https://raw.githubusercontent.com/badlogic/pi-mono/main/packages/coding-agent/README.md and `.../docs/providers.md` | relayed |
| S37 | DeepSeek Open Platform Terms of Service (effective 2026-04-29) | https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html | relayed |
| S38 | OpenClaw docs — OAuth concepts | https://docs.openclaw.ai/concepts/oauth | relayed |
| S39 | OpenClaw docs — Anthropic provider | https://docs.openclaw.ai/providers/anthropic | relayed |
| S40 | OpenClaw docs — OpenAI provider | https://docs.openclaw.ai/providers/openai | relayed |
| S41 | OpenClaw docs — Google provider | https://docs.openclaw.ai/providers/google | relayed |
| S42 | OpenClaw docs — GitHub Copilot provider | https://docs.openclaw.ai/providers/github-copilot | relayed |
| S43 | Press (secondary, not a terms source): VentureBeat on the April–May 2026 Anthropic changes | https://venturebeat.com/technology/anthropic-reinstates-openclaw-and-third-party-agent-usage-on-claude-subscriptions-with-a-catch | relayed |

---

## Questions answered

### Q1. How do openclaw and similar tools reuse subscriptions (mechanism, storage, refresh)?

Three distinct mechanisms exist in the public documentation, and they have very different terms consequences:

| Mechanism | What the tool does | Examples (public docs) | Tier in decision 6 |
|---|---|---|---|
| **M1. CLI delegation** | Runs the provider's installed CLI as a subprocess; the CLI owns the login. The tool holds no token. | OpenClaw "Claude CLI reuse": "Claude Code owns its existing login and subscription; OpenClaw does not persist or refresh that login." [S39] | Tier 1 |
| **M2. Provider-minted long-lived token handed to the provider's CLI or an official SDK** | The user mints a token with the provider's own command and exports it; the consumer is still the provider's client. | `claude setup-token` → `CLAUDE_CODE_OAUTH_TOKEN` [S2]; Copilot fine-grained PAT with the Copilot Requests permission → `COPILOT_GITHUB_TOKEN` [S22]; OpenRouter PKCE returning "a user-controlled API key" [S28] | Tier 1 (when the provider's CLI consumes it) or Tier 2 (when an official SDK consumes it) |
| **M3. Own OAuth client flow and token store** | The tool runs the OAuth (PKCE or device) flow itself against the provider's identity endpoint, stores access and refresh tokens, refreshes them, and calls the provider's backend directly, usually presenting itself as the provider's first-party client. | OpenClaw OpenAI Codex flow (PKCE, scope `openid profile email offline_access`, callback `http://localhost:1455/auth/callback`) [S38]; OpenClaw GitHub Copilot device login [S42]; opencode ChatGPT and Copilot logins [S34]; pi `/login` [S36] | **Tier 3** |

Storage and refresh, from public docs only:

| Tool | Storage | Refresh | Source |
|---|---|---|---|
| OpenClaw (M3) | SQLite: shared `~/.openclaw/state/openclaw.sqlite`, per agent `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`; rows in `auth_profile_store`, routing state in `auth_profile_state`. Older installs used `auth-profiles.json`, `auth-state.json`, per-agent `auth.json`, migrated by its doctor. Location overridable by `$OPENCLAW_STATE_DIR`. | Automatic: a stored access token is used while `expires` is in the future, otherwise refreshed and written back. A "token sink" rule makes one store canonical because "OAuth providers commonly mint a new refresh token on every login/refresh" and may invalidate the previous one. | S38 |
| OpenClaw Copilot | "puts the token in its protected local secret store and saves only a `tokenRef` in the auth profile" | Validates Copilot access and resolves the account-specific endpoint | S42 |
| opencode | `~/.local/share/opencode/auth.json` | not documented on the page read | S34 |
| pi | `auth.json` ("can contain API keys and OAuth tokens"); a key value may be a `!command` that reads a keychain instead of storing the secret | not documented on the page read | S36 |
| Claude Code (first party) | macOS Keychain; Linux `~/.claude/.credentials.json` mode `0600`; relocated by `CLAUDE_CONFIG_DIR` | Automatic; expiry warning three days ahead; `setup-token` yields a one-year token that "can only make model requests" | S2 |
| Codex CLI (first party) | `cli_auth_credentials_store` = `file` (`~/.codex/auth.json`), `keyring`, `auto`, `ephemeral` | "Codex refreshes tokens automatically during use before they expire" | S10 |
| Copilot CLI (first party) | OS keychain; fallback plaintext `~/.copilot/config.json` | OAuth token managed by the CLI | S22 |
| Gemini CLI (first party) | "cached locally for future sessions" | not documented on the page read | S15 |

The design consequence of the token-sink problem: a Tier 3 tool that refreshes a token it copied from a first-party CLI can invalidate the CLI's own login. That is a user-visible failure mode independent of terms, and a second reason to keep Tier 3 off.

### Q2. The terms matrix

See "Findings" (per-provider evidence) and "Matrix rows" (the matrix itself).

### Q3. What is allowed only for personal use?

See F-P1 to F-P4. In short: nothing in Tier 3 qualifies even for personal use. The personal-only items are (a) Claude subscription login through the **Agent SDK library** or a `CLAUDE_CODE_OAUTH_TOKEN` handled by the tool, (b) ChatGPT-login `codex exec` automation beyond a trusted personal machine, (c) GLM Coding Plan quota, which is usable only through a z.ai-supported tool, and (d) the fleet-internal harnesses.

### Q4. Is unattended, automated or agentic use of a subscription CLI restricted?

No provider read prohibits hours-long unattended runs of its own CLI outright. Every one of them conditions it. See F-U1 to F-U6.

---

## Findings

### Anthropic (Claude Code, Claude subscriptions)

- **F-A1** `verified-doc` [S1, raw]. Subscription OAuth is first-party only: "**OAuth authentication** is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications."
- **F-A2** `verified-doc` [S1, raw]. Tier 3 is prohibited for a distributed product: "Anthropic does not permit third-party developers to offer Claude web login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store, or intermediate Claude's web app credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow." And: "Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice."
- **F-A3** `verified-doc` [S1, raw]. Tier 1 has explicit support: the restrictions do not "prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription, including where a platform hosts Claude Code as described under *Can customers offer Claude Code in their products?* above."
- **F-A4** `verified-doc` [S1, raw]. Conditions for a product that runs Claude Code: "Unless we've mutually agreed otherwise, preinstalling or running Claude Code in your products or services (e.g. in hosted sandboxes or other agent infrastructure) requires agreeing to our Commercial Terms of Service and complying with the conditions below: **The Claude Code binary must not be modified.** … customers may not remove, disable, or restrict any authentication method built into it … **Customers may not pay for, resell, or intermediate Claude usage on their end users' behalf.** Each end user must authenticate with their own Anthropic API key, Claude subscription plan credentials, or 3P inference provider credential".
  - `inferred`: whether an MIT npm package that spawns the consumer's own, separately installed `claude` counts as "running Claude Code in your products" is not stated. The examples given are hosted. The conservative reading is that it does, so the distributed product must satisfy all three conditions, and the owner must agree to the Commercial Terms. Rests on F-A4.
  - `inferred`: a Specstride setting that forces one auth mode for the spawned `claude` (for example always passing `--bare`, or unsetting the login) could be read as "restrict any authentication method". The adapter must leave the choice to the user. Rests on F-A4.
- **F-A5** `verified-doc` [S4, raw]. The Agent SDK **library** with a subscription login is not allowed in a distributed product: "Unless previously approved, Anthropic does not allow third party developers to offer claude web login or rate limits for their products, including agents built on the Claude Agent SDK. Use the API key authentication methods described in the Quickstart instead." S1 agrees: "**Developers** building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication".
  - **Conflict recorded, not resolved.** S8 (relayed) lists among programmatic usage "third-party apps that authenticate with your Claude subscription through the Agent SDK" and says (update of 2026-06-15) "Claude Agent SDK, `claude -p`, and third-party app usage still draw from your subscription's usage limits." That describes billing for a user's usage; it is not a grant to developers. Where S4 and S8 pull apart, this report follows S4 and S1 because they are the terms-bearing pages.
- **F-A6** `verified-doc` [S3, raw]. `--bare` is incompatible with Tier 1 under a subscription: "Set `ANTHROPIC_API_KEY` before running it, because bare mode doesn't use your subscription login", "In bare mode, Claude Code never reads OAuth credentials or the system keychain", and "`--bare` is the recommended mode for scripted and SDK calls, and will become the default for `-p` in a future release." S2 adds: "Bare mode does not read `CLAUDE_CODE_OAUTH_TOKEN`."
  - `inferred`: when that default changes, a Tier 1 Claude adapter that runs `claude -p` under a subscription will need an explicit opt-out of bare mode, if one is offered, or it silently becomes Tier 2. This is a risk to decision 6's default and belongs to R5 for mechanics. Rests on F-A6.
- **F-A7** `verified-doc` [S2, raw]. A throwaway config home changes the credential that is read: "If you've set the `CLAUDE_CONFIG_DIR` environment variable, Claude Code keeps the `.credentials.json` file under that directory instead … and keys the macOS Keychain entry to that directory too". So Principle VIII's throwaway config home and Tier 1's logged-in CLI cannot both hold unless the login is supplied another way. Copying the credential file into the throwaway home would be the product handling a Claude's web app credential, which F-A2 forbids for a distributed product.
- **F-A8** `verified-doc` [S2, raw]. `claude setup-token` is a documented first-party path for scripts: "For CI pipelines, scripts, or other environments where interactive browser login isn't available, generate a one-year OAuth token with `claude setup-token`", "This token authenticates with your Claude subscription and requires a Pro, Max, Team, or Enterprise plan."
  - `inferred`: this is Tier 1 only while the token is consumed by the unmodified `claude` binary and is set by the user in their own environment. If Specstride stores it, even as a reference it resolves itself, the distributed product is "collect[ing], stor[ing]" a session token (F-A2). Rests on F-A2 and F-A8.
- **F-A9** `verified-doc` [S5, relayed]. The Consumer Terms prohibit automated access except "when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it". `inferred`: `claude -p`, `setup-token` and the Agent SDK are Anthropic's own documented automation surfaces (F-A8, S3, S8), which is the explicit permission that clause requires. The same terms say "You may not share your Account login information, Anthropic API key, or Account credentials with anyone else."
- **F-A10** `verified-doc` [S6, relayed]. Tier 2 is allowed for a product: the Commercial Terms give "permission to use the Services, including to power products and services Customer makes available to its own customers and end users", and S1 (raw) confirms that configuring "an API key in a development environment, secrets manager, or machine image" is unrestricted "provided the resulting usage is billed to the key owner".
- **F-A11** `verified-doc` [S43, relayed, secondary]. Press reports a ban on subscription-powered third-party agents on 2026-04-04, a credit plan announced 2026-05-13, and S8 shows that plan paused on 2026-06-15. `inferred`: the policy moved three times in 2026, so this row has the shortest shelf life in the matrix.

### OpenAI (Codex, ChatGPT plans)

- **F-O1** `verified-doc` [S10, relayed]. Codex supports ChatGPT sign-in ("subscription access") and API key. Credentials are cached per `cli_auth_credentials_store`. "Treat `~/.codex/auth.json` like a password: it contains access tokens."
- **F-O2** `verified-doc` [S10, S11, relayed]. Headless use under a ChatGPT login is documented but not the recommended default: "API keys are still the recommended default for automation." ChatGPT-managed auth in CI is described for trusted runners and is not recommended for public or open-source repositories.
- **F-O3** `unverified`. The OpenAI Terms of Use could not be retrieved (S13: HTTP 403 from the fetch tool and from curl with a browser user agent; the web archive is blocked for the fetch tool). A web search summary reports the prohibitions "automatically or programmatically extract data or Output" and "may not share your account credentials or make your account available to anyone else", and an effective date of 2026-01-01. These are second-hand and must be re-read by R8v.
- **F-O4** `unverified`. OpenClaw's docs state "OpenAI explicitly supports subscription OAuth usage in external tools and workflows like OpenClaw" [S40]. That is a third party's statement. No OpenAI page saying this was found (tried: Codex auth, non-interactive and pricing pages; a web search for an official statement; the help-centre article on Codex with a ChatGPT plan returned HTTP 403). Under the rule that "allowed" needs explicit provider support, Tier 3 for OpenAI is **not allowed** until an OpenAI-authored page is cited.
- **F-O5** `verified-doc` [S12, relayed]. Plans meter Codex by five-hour windows, and "If you reach your usage limits during an active turn, the agent will be able to continue working on that turn, subject to fair use limits."

### Google (Gemini CLI)

- **F-G1** `verified-doc` [S16, relayed]. Consumer login is gone: "Starting June 18, 2026, Gemini Code Assist IDE extensions stopped serving requests for the Gemini Code Assist for individuals, Google AI Pro, and Google AI Ultra tiers" and "you can no longer use the **Login with Google** option to access the IDE extensions or Gemini CLI". Gemini Code Assist Standard and Enterprise subscriptions keep access. Consumers are pointed to the Antigravity products.
  - `verified-doc` [S18, relayed]: the Gemini CLI quota page still lists consumer tiers beside a notice that "Gemini CLI was replaced by Antigravity CLI on June 18th, 2026" for unpaid and Google One users. The two pages are inconsistent; S16 is the deprecation notice and is followed here.
- **F-G2** `verified-doc` [S14, relayed]. Tier 3 is explicitly a violation: "Directly accessing the services powering Gemini CLI (for example, the Gemini Code Assist service) using third-party software, tools, or services (for example, using OpenClaw with Gemini CLI OAuth) is a violation of applicable terms and policies. Such actions may be grounds for suspension or termination of your account."
- **F-G3** `verified-doc` [S15, S17, relayed]. Tier 2 is allowed: Gemini CLI accepts `GEMINI_API_KEY` or Vertex AI credentials, and headless mode uses a cached credential or those environment variables. The Gemini API terms say the service "is for developers building with Google AI models for professional or business purposes, not for consumer use", and prohibit developing competing models and reverse engineering.
- **F-G4** `inferred`. The Antigravity CLI is a different product with its own terms (OpenClaw's docs say those terms "prohibit third-party tools from accessing the service through Antigravity OAuth" [S41], a third-party statement). It has no row here and falls under the unknown-provider row until researched. Rests on F-G1.

### GitHub (Copilot)

- **F-C1** `verified-doc` [S23, S24, relayed]. Headless use is documented, including CI: `copilot -p "…"`, and "A common use case for running Copilot CLI programmatically is to include a CLI command in a CI/CD workflow step." Usage is metered: "Each time you interact with Copilot in Copilot CLI's interactive interface, or use Copilot CLI programmatically, AI credits are consumed".
- **F-C2** `verified-doc` [S22, relayed]. Documented credentials: OAuth (browser or device flow), `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`, fine-grained PAT with the **Copilot Requests** permission, GitHub App user-to-server token; classic PATs are not supported. Storage is the OS keychain with a plaintext fallback at `~/.copilot/config.json`.
- **F-C3** `verified-doc` [S25, relayed]. The Copilot SDK officially supports a distributed app in which "Each user authenticates with their own GitHub account" and "Copilot usage is billed to each user's subscription", with `gho_`, `ghu_` and `github_pat_` tokens; "Your application is responsible for token storage, refresh, and expiration handling." `inferred`: because this is an official SDK with officially documented token types, it is Tier 2 in decision 6's terms, not Tier 3. Rests on F-C3.
- **F-C4** `verified-doc` [S26, relayed]. GitHub's support for opencode is a named partnership, not a general grant: "GitHub Copilot now fully supports authentication with OpenCode through a formal partnership". `inferred`: a third-party tool that replays a Copilot token against the Copilot backend outside the SDK, or presents itself as an editor client, has no explicit support and is `NOT-ALLOWED` at Tier 3.
- **F-C5** `verified-doc` [S19, S21, relayed]. General limits: "Your login may only be used by one person", "You may not share API tokens to exceed GitHub's rate limitations. Abuse or excessively frequent requests to GitHub via the API may result in the temporary or permanent suspension of your Account's access", and the acceptable use policy prohibits "excessive automated bulk activity".
- **F-C6** `verified-doc` [S20, relayed]. Which terms govern depends on the plan: Business and Enterprise under the GitHub Generative AI Services Terms (or Microsoft Product Terms), everyone else under Section J of the Terms of Service. The Generative AI Services Terms were not read (`unverified`).

### OpenRouter

- **F-R1** `verified-doc` [S27, relayed]. API keys are the access mechanism and the holder is responsible for them. Prohibited: to "access the Site or Service for purposes of reselling API access to Models or otherwise developing a competing service". Users must comply with the applicable model terms.
- **F-R2** `verified-doc` [S28, relayed]. The PKCE flow exists so that an app can "Connect your users to OpenRouter", and it returns "a user-controlled API key". `inferred`: this is an officially offered flow that yields an API key, so it is Tier 2. There is no subscription and no first-party agent CLI, so Tiers 1 and 3 are `N/A`.

### z.ai

- **F-Z1** `verified-doc` [S33, relayed]. Pay-as-you-go API: keys must be kept secret and not shared; "You are solely responsible for the systems, applications, or functions developed by using API Services", with an obligation to bind end users. Building on the API is contemplated.
- **F-Z2** `verified-doc` [S30, S31, S32, relayed]. The GLM Coding Plan is restricted to a list of tools: "The GLM Coding Plan is limited to use within the following officially supported tools and product environments; users may not use their subscription benefits for tools or scenarios outside of this scope." The list read includes Claude Code, Codex, OpenCode, Pi, Cline, Goose and OpenClaw among others. "Account sharing or multi-user access is prohibited." "Violations of the Usage Rules may trigger risk control measures, including rate limiting, account freezing, or other restrictions"; "Accounts with more than three violations may be banned".
  - `inferred`: Specstride is not on the list. A Specstride adapter that calls the Coding Plan endpoint directly with a Coding Plan key is outside scope. Running a listed harness (for example `claude` or `opencode` configured for z.ai) as the subprocess is inside scope. So Coding Plan quota is reachable only in Tier 1 style through a listed harness. Rests on F-Z2.

### opencode (a front for providers)

- **F-OC1** `verified-doc` [S34, S35, relayed]. opencode is open-source software under the licence in its repository; the opencode Terms of Service cover the website, the inference product and hosted offering only. Those terms require that use be "only … for your own internal use, and not on behalf of or for the benefit of any third party" and prohibit conduct that "automatically or programmatically extracts data or Output". `inferred`: the second clause is ambiguous for headless runs against opencode's own hosted inference, so that back end is `SILENT`, not allowed.
- **F-OC2** `verified-doc` [S34, relayed]. Terms are inherited per back end. opencode's own docs say Anthropic "explicitly prohibits" Claude Pro/Max use through it, and that the plugins were removed in version 1.3.0. Copilot through opencode has explicit provider support (F-C4). ChatGPT login through opencode is recommended by opencode; OpenAI's own position is unverified (F-O4).

### pi

- **F-PI1** `verified-doc` [S36, relayed]. pi is MIT-licensed, supports API keys by environment variable for 35+ providers and an interactive `/login` that stores subscription or API credentials in `auth.json`. Which subscription providers `/login` offers was not visible on the pages read (`unverified`).
- **F-PI2** `verified-local`. `pi --version` prints `0.80.6`. Fleet memory (qmd, document a fleet note on the model gateway (`infra/` collection)) records a headless smoke test of the form `pi -p --provider <gateway> --model <model>`, that is, pi driven through a local model gateway with an API key.
- **F-PI3** `inferred`. pi has no model service of its own, so its row is the row of whichever back end it is pointed at. Its subscription logins are mechanism M3 and inherit F-A2, F-G2 and F-O4. Rests on F-PI1.

### dsh and prime (fleet-internal)

- **F-D1** `verified-local`. `dsh --version` prints `0.1.0-rc.8`. `dsh --help` describes "a DeepSeek Harness profile — an ordered stack of plugin-bundle patch layers", with a `headless` profile: `dsh --profile headless "run the tests"`.
- **F-D2** `verified-local`. `prime --help` shows a launcher over named back-end variants (`prime <name> [args...]`, `prime --list`, `prime --check`) and warns that the agent's kernel "runs model-generated code with full host permissions". It has no version flag (prompt line 133).
- **F-D3** `verified-local` (qmd, documents under `infra/`). Both reach models through a local model gateway using a gateway API key. No subscription login is involved.
- **F-D4** `unverified`. Not known: the licence of either harness, whether either is or will be published, and the terms of the upstream model endpoints behind the gateway (tried: qmd queries for vendor, licence and upstream; `--help` output). The upstream endpoint terms decide the row, and they are the owner's contracts, not something a public consumer has.

### DeepSeek (the worked example of a discovered provider)

- **F-DS1** `verified-doc` [S37, relayed]. API keys are the credential: "Please keep your created API key securely, prevent any form of leakage, do not share or publicly disclose your API key with others".
- **F-DS2** `verified-doc` [S37, relayed]. Building for third parties is explicitly allowed: "You can integrate the capabilities of the DeepSeek models into various downstream systems, applications, or functionalities for intended purposes and specific scenarios, providing services to both internal and external end users", with the developer responsible for the downstream system. The page does not address reselling or automation limits.
- **F-DS3** `inferred`. DeepSeek has no subscription with OAuth and no first-party agent CLI found, so Tier 3 is `N/A` and "Tier 1" means a harness the consumer installed that is configured with the consumer's DeepSeek key. Rests on F-DS1.

### Personal-only items (deliverable 3)

- **F-P1** `inferred` from F-A5. Claude subscription login through the Agent SDK **library**: usable by the account holder for their own projects (S8), not offerable by a distributed product. **Personal only; off by default.**
- **F-P2** `inferred` from F-A2 and F-A8. `CLAUDE_CODE_OAUTH_TOKEN` referenced from Specstride config: **personal only; off by default.** In the distributed product the user exports it in their own shell and Specstride never names it.
- **F-P3** `inferred` from F-O2. `codex exec` under a ChatGPT login copied to another machine or a CI runner: documented for trusted runners only. **Personal only; off by default.** On the user's own workstation it is ordinary Tier 1.
- **F-P4** `inferred` from F-D4. dsh and prime adapters: **fleet only** until licence and upstream terms are known.
- **F-P5** `inferred` from F-A2, F-G2, F-O4, F-C4. Tier 3 has no personal-use exception anywhere. The Anthropic and Google texts bind the account holder as well as the developer (F-A1, F-G2).

### Unattended and agentic use (deliverable 4)

- **F-U1** `verified-doc` [S1, raw]. Anthropic: "Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK." No duration limit is stated. `inferred`: hours-long loops are permitted but are the pattern that the April 2026 restriction was aimed at (F-A11), so the account risk is real even at Tier 1.
- **F-U2** `verified-doc` [S2, raw]. Anthropic documents unattended sessions as a supported case: "Renewing early matters most for sessions that run unattended." [S3, raw] documents `--permission-prompts none` "when nobody is available to answer permission prompts, for example in a scheduled job."
- **F-U3** `verified-doc` [S7, relayed]. "Agentic use cases must still comply with the Usage Policy."
- **F-U4** `verified-doc` [S10, S11, S12, relayed]. OpenAI: automation is documented; API keys are "the recommended default for automation"; plan usage is "subject to fair use limits".
- **F-U5** `verified-doc` [S19, S21, S24, relayed]. GitHub: programmatic use is documented and metered; "excessive automated bulk activity" and "excessively frequent requests" can lead to suspension.
- **F-U6** `verified-doc` [S31, relayed]. z.ai: the Coding Plan has five-hour and weekly quotas and a three-strikes rule; account sharing is prohibited. Google [S14]: only third-party access is called out. DeepSeek [S37] and OpenRouter [S27]: nothing on unattended use was found on the pages read.

---

## Version/date pins

| Item | Value | How obtained |
|---|---|---|
| Access date, all sources | 2026-09-29 | — |
| Anthropic Consumer Terms | effective 2025-10-08 | S5 |
| Anthropic Commercial Terms | effective 2025-06-17 | S6 |
| Anthropic Usage Policy | effective 2025-09-15 | S7 |
| Claude Help Center Agent SDK article | update notice 2026-06-15 | S8 |
| OpenAI Terms of Use | effective 2026-01-01 (second-hand) | `unverified`, F-O3 |
| Gemini consumer login end | 2026-06-18 | S16 |
| Gemini API Additional Terms | effective 2026-03-23 | S17 |
| GitHub Terms of Service | effective 2026-04-27 | S19 |
| GitHub–opencode support | 2026-01-16 | S26 |
| OpenRouter Terms | last updated 2026-08-31 | S27 |
| Z.ai Terms of Use | effective 2026-04-14 | S33 |
| opencode Terms of Service | effective 2026-08-15 | S35 |
| DeepSeek Open Platform Terms | effective 2026-04-29 | S37 |
| `claude` | 2.1.284 | prompt line 133 |
| `codex` | 0.153.4 | prompt line 133 |
| `dsh` | 0.1.0-rc.8 | `dsh --version` |
| `pi` | 0.80.6 | `pi --version` |
| `prime` | no version flag | `prime --help` |
| `openclaw` | 2026.6.5 (5181e4f), installed at `/usr/bin/openclaw` | `openclaw --version`; its state was not read |
| `gemini`, `opencode` | not installed | `command -v` |
| `copilot` | present only inside an editor extension's storage; not a working CLI per the prompt | `command -v` |

Recommended re-check interval for the terms matrix: **30 days**, and on every release. Anthropic's position changed in February, April, May and June 2026; Google's in June 2026.

---

## Options compared

How the terms gate should treat the tiers.

| Option | Terms safety | Owner's budget (subscription quota) | Evolvability (decision 17) | Cost |
|---|---|---|---|---|
| **O1. Tier 1 by CLI subprocess and Tier 2; Tier 3 exists in the design with an empty allowlist** | High: every active path has provider text behind it | Kept: Tier 1 uses the subscription | High: a provider is added to the Tier 3 allowlist by data, with no core change | The Tier 3 code path is specified but unused |
| O2. Drop Tier 3 from the design | Highest | Kept | Lower: a provider that later permits reuse needs a design change | Contradicts decision 6 as written |
| O3. Enable Tier 3 where a third-party tool's docs claim permission (OpenAI, per S40) | Low: rests on a third party's statement | Slightly better for Codex | Same as O1 | A disproved cell, and account risk carried by consumers |
| O4. Tier 2 only in the distributed product | Highest for distribution | Lost for consumers who have only a subscription | High | Ignores the explicit Tier 1 support in S1 |

---

## Recommendation

**Adopt O1.** Ship Tier 1 (CLI subprocess only) and Tier 2; keep Tier 3 in the architecture as a data-driven allowlist that is **empty** at release, because no provider's own page explicitly permits third-party reuse of a subscription token. Confidence: **high** for Tier 3 being off for Anthropic and Google (explicit prohibitions, F-A2, F-G2); **medium-high** for Tier 1 and Tier 2 being allowed for Anthropic, GitHub, OpenRouter, z.ai API and DeepSeek; **medium** for OpenAI, because its Terms of Use could not be read (F-O3).

Rules the terms gate should encode:

1. The gate's input is a versioned data file (provider, tier, audience, status, source URL, access date, quoted sentence, `verified-on`). The doctor warns when `verified-on` is older than 30 days.
2. Two audiences, `personal` and `distributed`. The published package runs as `distributed`. `personal` is a config opt-in that is off by default and prints what it enables and the source it rests on.
3. In Tier 1 the product never reads, copies, stores, refreshes or relocates a provider credential, and never forces or removes an authentication method of the spawned CLI.
4. For Claude under a subscription the adapter is the `claude` subprocess. The Agent SDK library is used only with an API key or cloud-provider credential in the `distributed` audience (F-A5).
5. A provider with no row is unknown terms: Tiers 1 and 2 only, doctor warning, Tier 3 refused with the explanation (decision 17).
6. A harness that fronts several providers (opencode, pi, a gateway) is gated by the **back end's** row, not the front's.
7. The quota design (decision 8) should treat a provider's limit or enforcement signal as a stop, never as something to route around with a second account or token: S7 prohibits circumventing a ban "through the use of a different account", and S19 prohibits sharing tokens "to exceed GitHub's rate limitations".

---

## Matrix rows

### Terms matrix

Each cell: status, then the finding and source it rests on. (A) = personal tool used by the account holder. (B) = distributed MIT product used by consumers on their own accounts.

| Provider | Audience | Tier 1: own CLI headless under the user's login | Tier 2: API key / official SDK | Tier 3: subscription token reuse by a third-party tool | Risk to the account | Resulting tier |
|---|---|---|---|---|---|---|
| **Anthropic** | A | `ALLOWED-EXPLICIT` — F-A3, F-A8, F-A9 [S1, S2, S5] | `ALLOWED-EXPLICIT` — F-A10 [S1, S6] | `NOT-ALLOWED` — F-A1 [S1] | Medium: limits "assume ordinary, individual usage" (F-U1); enforcement "without prior notice" (F-A2) | **1** (default), 2 |
| | B | `CONDITIONAL` — unmodified binary, no auth method restricted, each user on their own credentials, owner agrees to the Commercial Terms; CLI subprocess only, not the Agent SDK library — F-A3, F-A4, F-A5 [S1, S4] | `ALLOWED-EXPLICIT` — F-A10 [S1, S6] | `NOT-ALLOWED` — F-A2 [S1] | Medium for Tier 1; high for anything touching tokens | **1** (conditions), 2 |
| **OpenAI** | A | `ALLOWED-DOCUMENTED` — F-O1, F-O2 [S10, S11]; Terms of Use unread (F-O3) | `ALLOWED-DOCUMENTED` — "API keys are still the recommended default for automation" [S10]; Terms unread | `NOT-ALLOWED` — no OpenAI text found; third-party claim only (F-O4) | Medium: "fair use limits" (F-O5); unread Terms | **1**, 2 |
| | B | `ALLOWED-DOCUMENTED` on the consumer's own workstation; ChatGPT login on other machines or CI is personal-only (F-P3) [S10, S11] | `ALLOWED-DOCUMENTED` [S10]; OpenAI Services Agreement unread (`unverified`) | `NOT-ALLOWED` — F-O4 | Medium | **1**, 2 |
| **Google (Gemini CLI)** | A | `NOT-ALLOWED` for consumer accounts: the login no longer exists (F-G1) [S16]. `ALLOWED-DOCUMENTED` for Code Assist Standard/Enterprise logins [S15, S16] | `ALLOWED-EXPLICIT` — F-G3 [S15, S17] | `NOT-ALLOWED` — F-G2 [S14] | High at Tier 3: "grounds for suspension or termination" | **2** (1 only with Standard/Enterprise) |
| | B | same as A | `ALLOWED-EXPLICIT` — F-G3 [S17] | `NOT-ALLOWED` — F-G2 [S14] | same | **2** |
| **GitHub Copilot** | A | `ALLOWED-EXPLICIT` — F-C1, F-C2 [S22, S23, S24] | `ALLOWED-EXPLICIT` — fine-grained PAT, Copilot SDK — F-C2, F-C3 [S22, S25] | `NOT-ALLOWED` — explicit support exists only for a named partner (F-C4) [S26] | Medium: F-C5 [S19, S21]; metered credits | **1**, 2 |
| | B | `ALLOWED-DOCUMENTED` — the consumer runs GitHub's CLI; terms do not address an orchestrator [S23] | `ALLOWED-EXPLICIT` — "Each user authenticates with their own GitHub account" (F-C3) [S25] | `NOT-ALLOWED` — F-C4 | Medium | **1**, 2 |
| **OpenRouter** | A | `N/A` — no first-party agent CLI | `ALLOWED-EXPLICIT` — F-R1, F-R2 [S27, S28] | `N/A` — no subscription | Low; upstream model terms apply | **2** |
| | B | `N/A` | `ALLOWED-EXPLICIT`, each consumer on their own key; no reselling (F-R1) [S27, S28] | `N/A` | Low | **2** |
| **z.ai** | A | `ALLOWED-EXPLICIT` for Coding Plan quota through a listed tool (F-Z2) [S32] | `ALLOWED-EXPLICIT` for the pay-as-you-go API (F-Z1) [S33]; `NOT-ALLOWED` for Coding Plan quota from a Specstride adapter (F-Z2) [S30] | `NOT-ALLOWED` — Coding Plan outside listed tools (F-Z2) [S31, S32] | Medium: freezing; ban after three violations [S31] | **1** (Coding Plan via a listed harness), **2** (API) |
| | B | same as A | same as A | `NOT-ALLOWED` | Medium | **1**, **2** |
| **opencode** | A | `ALLOWED-DOCUMENTED` for the MIT software; the back end's row decides (F-OC2). Copilot back end `ALLOWED-EXPLICIT` [S26]; Claude subscription back end `NOT-ALLOWED` [S34, S1]; opencode's hosted inference `SILENT` (F-OC1) [S35] | per back end | `NOT-ALLOWED` except where the back end's provider names opencode (Copilot, F-C4) — and then opencode, not Specstride, is the permitted client | Inherits the back end's risk | **1**, gated by back end |
| | B | same as A | per back end | `NOT-ALLOWED` | same | **1**, gated by back end |
| **pi** | A | `ALLOWED-DOCUMENTED` for the MIT software with API-key back ends (F-PI1, F-PI2) [S36]; subscription logins inside pi inherit the back end's prohibition (F-PI3) | per back end | `NOT-ALLOWED` — F-PI3 | Inherits the back end's risk | **1**, gated by back end |
| | B | same as A | per back end | `NOT-ALLOWED` | same | **1**, gated by back end |
| **dsh** | A | Known: headless profile, reaches models through a local gateway with an API key (F-D1, F-D3). Not known: licence, upstream terms (F-D4). Status `SILENT` | per upstream endpoint, `unverified` | `N/A` — no subscription login | Unknown | **1/2, fleet only**, unknown terms |
| | B | `SILENT` — not known to be published (F-D4) | per upstream endpoint | `N/A` | Unknown | Discovered-harness rules; unknown terms |
| **prime** | A | Known: launcher over back-end variants through a local gateway with an API key; runs model code with host permissions (F-D2, F-D3). Not known: licence, upstream terms. Status `SILENT` | per upstream endpoint, `unverified` | `N/A` | Unknown | **1/2, fleet only**, unknown terms |
| | B | `SILENT` (F-D4) | per upstream endpoint | `N/A` | Unknown | Discovered-harness rules; unknown terms |
| **DeepSeek** | A | `N/A` as a first-party CLI; a consumer-installed harness with the consumer's key is Tier 1 in form and Tier 2 in terms (F-DS3) | `ALLOWED-EXPLICIT` — F-DS1, F-DS2 [S37] | `N/A` | Low; key leakage is the holder's liability [S37] | **2** (or 1 via a discovered harness) |
| | B | same as A | `ALLOWED-EXPLICIT` — "providing services to both internal and external end users" [S37] | `N/A` | Low | **2** |
| **Unknown provider** | A | Permitted by decision 17 as unknown terms, with a doctor warning; status `SILENT` | same | `NOT-ALLOWED` — refused with an explanation | Unknown; the warning says so | **1 or 2 only** |
| | B | same | same | `NOT-ALLOWED` | Unknown | **1 or 2 only** |

### Harness Capability Matrix — columns owned by R8

Other columns belong to R5, R6, R7, R9, R10, R14 and R20.

| Harness | Tier | Terms status (before R8v) | Auth modes that pass the gate |
|---|---|---|---|
| Claude | 1, 2 | Tier 1 explicit for personal, conditional for distributed; Tier 3 prohibited | Subscription login inside the unmodified CLI; API key; cloud-provider credential |
| Codex | 1, 2 | Documented; Terms of Use unread; Tier 3 unsupported | ChatGPT login inside the CLI on the user's machine; API key |
| Gemini CLI | 2 | Consumer login ended 2026-06-18; Tier 3 prohibited | API key; Vertex AI; Standard/Enterprise login |
| Copilot | 1, 2 | Explicit; Tier 3 unsupported | CLI login; fine-grained PAT with Copilot Requests; Copilot SDK with the user's token |
| OpenRouter | 2 | Explicit | API key, including one issued by PKCE |
| z.ai | 1, 2 | Coding Plan only through a listed tool; API explicit | Coding Plan key inside a listed harness; pay-as-you-go API key |
| opencode | 1 | Gated by back end | Back end's own |
| pi | 1 | Gated by back end | API key back ends |
| dsh | 1/2 | Unknown terms, fleet only | Gateway API key |
| prime | 1/2 | Unknown terms, fleet only | Gateway API key |
| Generic discovered harness (DeepSeek as example) | 1 or 2 | Unknown unless a row exists; DeepSeek API explicit | API key |

---

## Open questions / risks

1. **No provider qualifies for Tier 3.** Decision 6 stands as written (Tier 3 "off and refused with an explanation"), so this is a finding and not a conflict. The owner should know that Tier 3 ships empty.
2. **No provider is unsupportable at every tier**, so the stop rule at prompt line 260 is not triggered. The nearest case is Gemini CLI for consumer Google accounts, which has lost Tier 1 and works at Tier 2 only.
3. **`DECISIONS-PENDING` candidate — Anthropic, distributed Tier 1.** S1 conditions running Claude Code in a product on agreeing to the Commercial Terms, and S4 forbids offering claude web login or rate limits through Agent SDK agents "unless previously approved". Default to proceed on: distributed builds use the `claude` subprocess under the consumer's own login and use the Agent SDK library with API keys only. If the owner obtains approval from Anthropic, the Agent SDK with subscription login can be enabled for the distributed audience.
4. **`DECISIONS-PENDING` candidate — `--bare` becoming the default for `-p`** (F-A6) would silently turn Tier 1 Claude into Tier 2, against decision 6's default and the owner's budget. Default to proceed on: the adapter states its mode explicitly and the doctor reports which credential class is active. R5 owns the mechanics.
5. **Principle VIII versus Tier 1** (F-A7): a throwaway config home has no login, and copying one in is credential handling. This needs a divergence-register ruling; the terms evidence favours leaving the user's config home in place for Tier 1.
6. **OpenAI Terms of Use unread** (F-O3). R8v should retrieve the page by another route. If it prohibits programmatic access under consumer plans without an exception for Codex, the OpenAI Tier 1 cells fall to `NOT-ALLOWED` and Codex becomes Tier 2 only.
7. **Relayed quotes.** Thirty-nine of the forty-three sources were read through a summarising fetch tool. The wording must be re-checked before it is copied into a specification.
8. **Not read:** GitHub Generative AI Services Terms, OpenAI Services Agreement, Google Terms of Service and Google Cloud terms, the Antigravity terms, the public source code of OpenClaw (its mechanism is described from its documentation only), and pi's list of subscription providers.
9. **Volatility.** Anthropic changed position four times between February and June 2026 (F-A11). A matrix pinned in a release will go stale; the gate data should be updatable without a product release, in the same way as discovery descriptors.
10. **Fleet harnesses** (dsh, prime): licence and upstream endpoint terms are unknown (F-D4). They stay fleet-only until the owner supplies them.
