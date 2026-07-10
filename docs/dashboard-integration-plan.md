# Dashboard Integration Plan

## Target architecture

```text
Authenticated partner
        ↓
Partner Command Center /dashboard/
        ↓
GET /api/dashboard/bootstrap
        ↓
Partner Command Center adapters
        ├── Partners
        ├── Funding Leads
        ├── Partner Events
        ├── Tracking Links
        ├── Partner Resources
        └── Widget preset assignments
```

The FPOS shell is ported into Partner Command Center. No live partner data remains in FPOS localStorage. FPOS does not become a backend or an additional deployment dependency.

## Primary dashboard shell

**Visual source:** `JFeimster/fpos`

**Owner repository:** `JFeimster/partner-command-center`

**Target route:** `/dashboard/`

**Architecture:** static-first HTML/CSS/JavaScript with authenticated API calls. A React migration is not required for MVP.

## Authentication direction

MVP requires a server-verifiable partner session before returning dashboard data.

Recommended order:

1. Use a signed, expiring partner session cookie.
2. Resolve the session to exactly one active Partner record.
3. Derive `partner_id` server-side.
4. Ignore any browser-supplied `partner_id` when loading private dashboard data.
5. Return only partner-visible projections.

The Supabase route-guard pattern from Funding Partners OS Agent Dashboard can be adapted if Supabase remains the chosen identity provider. The dashboard data contract must remain provider-neutral.

## Required API endpoints

### MVP endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/bootstrap` | Return partner, summary, first-page leads, events, links, resources, widgets, commissions, notifications, and permissions |
| GET | `/api/dashboard/leads` | Paginated partner-owned lead list with safe filters |
| GET | `/api/dashboard/leads/:lead_id` | Safe lead detail projection |
| POST | `/api/lead-router` | Existing canonical partner-attributed funding-lead submission |
| GET | `/api/dashboard/events` | Paginated partner-visible activity |
| GET | `/api/dashboard/tracking-links` | List partner tracking links and safe performance counts |
| POST | `/api/partner-links` | Existing or extended tracking-link creation route |
| GET | `/api/dashboard/resources` | List assigned and available partner resources |
| GET | `/api/dashboard/widgets` | List approved widget presets and partner assignments |
| GET | `/api/dashboard/commissions` | Return estimated, verified, and paid totals with labels |
| GET | `/api/dashboard/notifications` | Return partner-safe notifications |
| PATCH | `/api/dashboard/notifications/:notification_id` | Mark notification read |
| GET | `/api/dashboard/profile` | Return editable and read-only profile fields |
| PATCH | `/api/dashboard/profile` | Update approved partner profile and preference fields |

### Later endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/campaigns` | Campaign list and performance |
| POST | `/api/dashboard/campaigns` | Create approved campaign container |
| GET | `/api/dashboard/academy` | Assigned training and completion |
| GET | `/api/dashboard/team` | Agency/sub-partner roster |
| POST | `/api/dashboard/integration-requests` | Request webhook or CRM integration |

## Bootstrap response

`GET /api/dashboard/bootstrap` should validate against:

```text
schemas/dashboard-data-contract.json
```

The endpoint should accept only safe presentation filters such as item limits. It must derive the partner from the authenticated session.

Recommended response behavior:

- `200` with the complete dashboard projection.
- `401` when no valid session exists.
- `403` when the Partner record is not active or permitted.
- `404` when the session cannot be associated with a Partner record.
- `503` when a required data source is unavailable and no safe partial response can be produced.

A partial-data response may be returned with `200` only if missing modules are clearly identified and core identity/lead isolation remains intact.

## Data-source mapping

| Dashboard domain | Primary source | Notes |
|---|---|---|
| partner profile | Partners database | Partner ID, tier, status, contact, brand, onboarding |
| leads | Funding Leads database | Filter by validated Partner relation or partner ID |
| activity | Partner Events database | Include only events marked partner-visible |
| tracking links | Tracking Links database | Use stable text tracking key/referral token externally |
| resources | Partner Resources database | Use partner assignments, availability, and status |
| widgets | Embed Widgets preset registry plus assignments | Store references and partner configuration, not copied scoring logic |
| readiness result | Funding Lead projection from Am I Fundable | Am I Fundable remains score owner |
| commission estimates | Partner Command Center calculation service | Estimates must be separately labeled from verified payouts |
| verified commissions | authorized internal record | Do not infer verified amounts from requested amount alone |
| notifications | Partner Events projection or notification store | Keep message public-safe |

## Data fields needed

### Partner

- `partner_id`
- display name
- company name
- status
- tier
- verification status
- onboarding completion
- logo URL
- website URL
- contact email and phone
- default campaign
- default destination
- notification preferences
- created and updated timestamps

### Lead

- `lead_id`
- business display name
- partner-visible status
- requested amount or range
- readiness score and tier
- primary funding family
- lead priority
- source system and URL
- tracking-link, campaign, and widget IDs
- next partner action
- document-status summary
- estimated commission
- commission status
- submitted and updated timestamps

### Tracking link

- stable tracking-link key
- name
- destination URL
- tracking URL
- campaign ID
- widget ID
- UTMs
- status
- click count
- lead-submission count

### Resource

- resource ID
- name
- description
- category
- format
- resource/download URL
- status
- vertical tags
- campaign tags
- compliance status
- updated timestamp

### Widget

- preset ID
- widget ID
- name
- description
- status
- preview URL
- embed URL
- campaign ID
- tracking-link ID
- theme summary
- consent version

### Commission

- estimated amount
- pending-verification amount
- verified amount
- paid amount
- calculation disclaimer
- last verified timestamp

## Public/private boundary

### Partner-visible

- safe business display name
- partner-owned lead ID
- readiness score/tier
- public funding-family guidance
- public lead status
- partner action required
- document readiness summary
- source and campaign attribution
- estimated commission with disclaimer
- verified commission when authorized

### Never returned to the partner dashboard

- SSNs or tax IDs
- bank credentials or account numbers
- uploaded document contents
- exact provider/lender matching unless authorized
- underwriting notes
- internal review comments
- provider compensation details
- other partners’ records
- raw Notion page IDs where a stable external ID exists
- API keys, integration secrets, or service-account credentials

## Shell migration tasks

### Phase 1 — Shell and session

1. Create `/dashboard/` inside Partner Command Center.
2. Port the FPOS responsive shell, mobile menu, typography, and card system.
3. Replace FPOS labels such as `STANDALONE_BETA`, `NODE`, `underwriting checks`, and simulated system telemetry.
4. Implement authenticated partner session resolution.
5. Add a loading, unauthorized, empty, and degraded-data state.

### Phase 2 — Bootstrap and Overview

1. Implement `/api/dashboard/bootstrap`.
2. Add the dashboard data-contract validator.
3. Map Partners and first-page Partner Events.
4. Add summary metrics from Funding Leads and Tracking Links.
5. Render safe notifications and next actions.

### Phase 3 — Leads

1. Replace the local FPOS deal ledger with API-loaded Funding Leads.
2. Implement list, filters, pagination, and detail projection.
3. Connect Submit Lead to `/api/lead-router`.
4. Preserve attribution fields automatically.
5. Remove drag-and-drop status mutation for partners.
6. Allow Kanban as a read-only presentation mode.

### Phase 4 — Links and Resources

1. Connect Tracking Links list and creation.
2. Add stable tracking-link keys.
3. Render assigned Partner Resources.
4. Add copy/open/download actions.
5. Log partner-visible events for link and resource activity where useful.

### Phase 5 — Widgets

1. Load the Embed Widgets preset registry.
2. Surface `funding-readiness-scorecard-widget` first.
3. Generate partner-attributed iframe and JavaScript snippets.
4. Store configuration references and activation status.
5. Keep Partner Command Center API credentials server-side.

### Phase 6 — Commissions and Settings

1. Add estimated commission calculations with explicit disclaimers.
2. Add verified/paid fields only when an authorized data source exists.
3. Add profile and brand settings.
4. Add notification preferences.
5. Keep partner identity, tier, and verification fields read-only.

## MVP module order

1. Authentication and partner session
2. Dashboard bootstrap API
3. Overview
4. Lead list and lead detail
5. Submit Lead
6. Tracking Links
7. Resources
8. Widgets
9. Commission estimates
10. Settings and notifications

Do not start Campaigns, Academy, Network, AI Chat, or billing until the first ten items operate against live partner-isolated data.

## White-label direction

MVP white-label support should include:

- partner logo
- company/brand name
- primary accent color
- CTA labels
- approved destination defaults
- widget theme defaults

Do not implement custom domains, arbitrary CSS injection, or fully separate tenant deployments in MVP.

## Implementation effort

The recommended path is lower effort than adopting a separate React dashboard because:

- Partner Command Center is already static-first.
- Existing APIs and Notion adapters remain in the owner repo.
- FPOS shell markup can be ported without a framework migration.
- Existing Partner Command Center modules can be progressively re-bound to the new shell.
- Deployment remains one controlled Vercel project.

## Acceptance criteria for the first implementation sprint

- partner session cannot load another partner’s data
- `/api/dashboard/bootstrap` validates against the schema
- Overview contains no simulated metrics
- Leads are loaded from Funding Leads, not localStorage
- Submit Lead reaches `/api/lead-router`
- tracking links preserve partner/campaign/widget attribution
- resource records come from Partner Resources
- first Embed Widgets preset is available
- commission estimates are visibly labeled as estimates
- mobile navigation works at 320px width
- no deployment-control file is weakened outside the controlled release window
