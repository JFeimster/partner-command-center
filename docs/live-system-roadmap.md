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
