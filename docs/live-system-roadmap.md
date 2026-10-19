# Live System Roadmap

## Live build correction

Partner Command Center's first live backend workflow is **partner signup and activation**.

Lead Submission + Funding Router is not Sprint 00, Sprint 01, Sprint 02, Sprint 03, or Sprint 04. It is downstream of partner activation because attribution, permissions, resources, and dashboard context all depend on `partner_id`.

## Sprint order

| Sprint | Name | Live-system purpose | Backend/API code? |
|---|---|---|---|
| 00 | Partner Signup Source-of-Truth Alignment | Align repo docs and module contracts around partner signup first. | No |
| 01 | Notion Partner CRM | Add Notion database layer and server-side helper contracts. | Yes, server-side helpers only |
| 02 | Tally Signup Webhook -> API Router -> Notion | Create live partner signup ingestion through `/api/router.js`. | Yes |
| 03 | Partner Access + Dashboard Activation | Connect dashboard surfaces to partner profile and activation context. | Yes, dashboard client calls only; no secrets in browser |
| 04 | Partner Link Builder + Resource Assignment | Give activated partners useful tools: tracking links and assigned resources. | Yes |
| 05 | Lead Submission + Funding Router | Add partner-attributed lead submission only after partner activation works. | Yes |

## Live dependency gates

### Gate 1 — Source-of-truth alignment

Required before code:

- Partner signup is documented as the first live workflow.
- Lead routing is documented as downstream of partner activation.
- `partner-command-center` is documented as live product shell.
- `partner-intake-os` is documented as intake/reference library.
- The partner data object is defined.
- Dashboard surfaces affected by activation are listed.

### Gate 2 — Notion CRM foundation

Required before Tally webhook ingestion:

- Notion Partners database exists.
- Partner Events database exists.
- Partner Resources database exists.
- Tracking Links database exists.
- Required environment variables are configured server-side.
- Notion integration is shared with each database.
- No Notion credentials are exposed to browser JavaScript.

### Gate 3 — Partner signup ingestion

Required before dashboard live mode:

- `/api/router.js` exists.
- `receivePartnerSignup` action exists.
- Tally webhook secret validation exists.
- Admin/manual `X-API-Key` validation exists.
- Partner normalization exists.
- `partner_id` creation/preservation exists.
- Notion Partner create/update exists.

GPT Action partner signup uses `/api/partner-signup`. Tally/default form ingestion continues to use `/api/router` with `receivePartnerSignup`. Lead submission remains downstream of partner activation.

### Gate 4 — Dashboard activation

Required before tracking links:

- Partner access can look up or create profile context.
- Welcome page can show onboarding path.
- Dashboard overview can load partner profile.
- Onboarding checklist reflects partner path.
- Resources reflect assigned resources.
- Partner ID section shows live `partner_id`.
- Live failures are shown as real errors.

### Gate 5 — Partner tools

Required before lead submission:

- Tracking link builder uses `partner_id`.
- Tracking links store in Notion Tracking Links database.
- Resource assignment uses partner type and onboarding path.
- Assigned resources render in dashboard.

### Gate 6 — Lead submission

Required for first live lead workflow:

- Every lead requires `partner_id`.
- Missing `partner_id` causes rejection.
- Lead storage exists.
- Lead event/status storage exists.
- Funding recommendations remain compliance-safe and do not imply approval, underwriting, or guaranteed funding.

## Compatibility with current static roadmap

The current repository can remain static-first while live CRM work is added in controlled sprints.

Static demo mode is still useful for UX review, local testing, and partner education.

Live mode must not pretend to work when backend calls fail. The rule is simple: **demo can demo; live must tell the truth**.

## Environment variables reserved for live sprints

```text
NOTION_API_KEY
NOTION_PARTNERS_DB_ID
NOTION_PARTNER_EVENTS_DB_ID
NOTION_PARTNER_RESOURCES_DB_ID
NOTION_TRACKING_LINKS_DB_ID
PARTNER_COMMAND_API_KEY
MOONSHINE_TALLY_WEBHOOK_SECRET
```

Use `MOONSHINE_TALLY_WEBHOOK_SECRET` for the Tally webhook contract because the existing webhook example already reads `process.env.MOONSHINE_TALLY_WEBHOOK_SECRET`. If Sprint 02 intentionally renames this to `TALLY_WEBHOOK_SECRET`, the handler update and documentation update must land in the same change.

These are not used in Sprint 00 because Sprint 00 does not add code.

## Future `/api/router.js` principle

Use one unified router instead of endpoint sprawl.

Reserved action groups:

- Partner signup and activation.
- Partner lookup.
- Partner classification.
- Onboarding assignment.
- Resource assignment.
- Tracking links.
- Partner events.
- Later: partner-attributed lead submission.

The router should return JSON only and keep secrets server-side.

## Modernization backlog and current evidence — 2026-10-19

| Item | Existing implementation and verified gap | Canonical owner | Proposed deliverable and acceptance criteria | External dependency |
|---|---|---|---|---|
| Next.js migration, batch 1 | `main` has plain HTML/CSS/JavaScript plus Vercel functions. No Next.js package or App Router exists. Vercel is connected to this repository, uses Node 24.x, and has `main` as its production branch. | Partner Command frontend; Vercel remains the host | Add the App Router foundation, migrate `/` and a dynamic `/dashboard` shell, and rebuild the remaining legacy routes/assets into the deployment from their current files. Pass production build; direct load/refresh; query and attribution; API, header, metadata, and old-route checks in Preview. Keep authenticated page output `private, no-store`. | Preview requires the connected Vercel project and SSO-authorized reviewer access. A non-main branch creates Preview; it does not target the `main` production branch. |
| Remaining URL batches | The current route inventory and source HTML remain in the repository; most requested routes are not Next pages. | Partner Command for app/operator routes; canonical sister sites retain public recruitment, partner identity, and tool discovery | Migrate one route family at a time; compare direct loads, refresh, navigation, search parameters, redirects, titles, metadata, attribution, response headers, keyboard and mobile behavior before removing a legacy implementation. Preserve all current URL paths and `/api/*` contracts. | None for code; each Preview batch needs a verified access path. |
| Intake health and exceptions | Worker code implements R2 receipt storage, a receipt-pointer queue, bounded retry/DLQ behavior, a five-minute recovery sweep, and serialized queue reconciliation. `GET /api/intake-health` reports configured readiness only. No operator receipt-exception view or reconciliation report is present. Worker README says the R2 bucket and queues must be provisioned; live Cloudflare resources and receipts have not been inspected in this session. | Cloudflare owns intake transport; Vercel owns API outcomes; Partner Command Admin owns operator visibility | After server-enforced operator identity exists, add a read-only page and dry-run reconciliation report with freshness, receipt age/attempt, per-destination status, and redacted identifiers. Missing evidence must display as unknown. | Cloudflare authenticated API/CLI access and confirmation of deployed bindings/log retention; operator authorization implementation. |
| Campaign Studio continuation | Issue [#81](https://github.com/JFeimster/partner-command-center/issues/81) is open. Draft PR [#82](https://github.com/JFeimster/partner-command-center/pull/82) contains MC-001 draft data, read-only preview, and a local-only editor; it has no server persistence or authenticated editing. The observed Cloudflare failure was Wrangler rejecting the missing `previews` block; PR #82 now adds an empty preview block, and its latest Workers Build, Vercel Preview, and GitHub validation checks pass. | Partner Command Campaign Studio; Cloudflare Worker remains independent | Continue the existing PR: server-authorized durable draft/version storage, conflict checks, step and condition editing, verified assets, synthetic journey tests, and explicit draft/ready/active/paused states. Keep MC-001 a draft; no enrollment or messages. Preserve regression checks. | Durable storage and operator auth must use established services and contracts; the current Cloudflare Preview check does not validate live intake delivery or production bindings. |
| Partner workflow coverage | `dashboard.html` and current dashboard APIs provide bootstrap, distribution, and profile paths; task and tracking-link APIs exist. The planned session-owned lead list and detail routes are absent from the current endpoint inventory. | Partner Command | Extend the existing dashboard from the session-owned identity with lead list/detail, next actions/follow-up, tracking and attribution, and assigned resources. Acceptance: unauthorized and cross-partner requests are rejected; no browser-selected partner ID grants access; existing Account/Growth/Team/Learn capabilities are reused. | Verify the established partner session and current task/link services before adding endpoints. |
| MCP adapter | Available BrokerFlow tools operate on BrokerFlow workspaces, reviews, and follow-up tasks. No Partner Command MCP adapter or shared identity/record contract is established. | Partner Command for any future adapter; BrokerFlow retains its own workspace and review ownership | Defer until the corresponding Partner Command APIs exist. Start read-only with per-record checks, scoped authorization, redacted/paginated results, and audit logging; do not mirror BrokerFlow records or expose raw CRM/SQL/HTTP. | Demonstrate an API gap and confirm independent organization/authorization boundaries before proposing an adapter. |

### Baseline observed on the current production deployment

The latest Vercel production deployment was Ready when inspected. Public `/`, `/dashboard`, `/admin/`, `/tools/commission-simulator`, `/widgets/funding-widget`, and `/api/intake-health` each returned HTTP 200. Page titles/descriptions matched their existing HTML files. Responses reported `Cache-Control: public, max-age=0, must-revalidate`; this baseline does not establish authenticated dashboard access or successful intake delivery. The live dashboard API and intake records were not read as part of this route baseline.

### Master Applicants access finding

Live Google Drive permission metadata for the existing `Master Applicants CRM` spreadsheet returned an `anyone` permission with role `writer` and `allowFileDiscovery: false` on 2026-10-19. Link discovery being off does not remove link-based edit access. Remediation: in Drive's Share dialog, change General access to **Restricted** (remove the `Anyone with the link` principal), then grant only named authorized accounts/groups with the minimum needed role. Verify by re-reading Drive file permission metadata and confirming no permission has `type: anyone`; test an unrelated signed-out/incognito browser and confirm it receives an access request/denial. Preserve the existing spreadsheet, all sheet IDs, and `Master Applicants!A:AT`; no sharing change was made in this task.
