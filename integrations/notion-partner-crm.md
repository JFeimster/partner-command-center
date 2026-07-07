# Notion Partner CRM

## Purpose

Sprint 01 adds Notion as the first live CRM/database layer for Partner Command Center partner records and activation state.

This sprint does **not** add the live Tally webhook or `/api/router.js`. That comes in Sprint 02. Sprint 01 builds the database contract and server-side helper layer so Sprint 02 has something sturdy to plug into instead of duct-taping webhooks to vibes.

## Live CRM position

```text
Tally partner signup
  -> API/router
  -> Notion Partner record
  -> partner_id
  -> onboarding path
  -> assigned resources
  -> dashboard access
  -> tracking links
  -> lead submission later
```

Notion owns the first live system of record for:

- Partner identity.
- Partner lifecycle status.
- Partner classification state.
- Onboarding path.
- Resource recommendations.
- Campaign recommendations.
- Partner events.
- Tracking links.

## Required Notion databases

Create these four databases in Notion:

1. **Partners**
2. **Partner Events**
3. **Partner Resources**
4. **Tracking Links**

Each database must be shared with the Notion integration connected to `NOTION_API_KEY`.

## Required environment variables

```text
NOTION_API_KEY
NOTION_PARTNERS_DB_ID
NOTION_PARTNER_EVENTS_DB_ID
NOTION_PARTNER_RESOURCES_DB_ID
NOTION_TRACKING_LINKS_DB_ID
PARTNER_COMMAND_API_KEY
TALLY_WEBHOOK_SECRET
```

Sprint 01 uses only the Notion-related values in the helper layer. `PARTNER_COMMAND_API_KEY` and `TALLY_WEBHOOK_SECRET` are reserved for Sprint 02 router authentication.

## Database setup instructions

### 1. Create the Notion integration

1. Open Notion's integration settings.
2. Create a new internal integration named `Partner Command Center`.
3. Copy the integration secret.
4. Store it as `NOTION_API_KEY` in Vercel or the server runtime.
5. Do not paste this value into browser JavaScript, static HTML, public config files, screenshots, or docs.

### 2. Create the Partners database

Create a Notion database named `Partners` with the properties listed in `notion-partner-database-schema.json`.

Required Partner properties:

- Partner ID
- Name
- Email
- Phone
- Company
- Website
- Partner Type
- Audience
- Referral Source
- Traffic Source
- Status
- Tier
- Onboarding Path
- Resource Recommendations
- Campaign Recommendations
- Tally Submission ID
- Created At
- Updated At

### 3. Create Partner Events database

Create a Notion database named `Partner Events`.

Use it for lifecycle and audit events such as:

- `signup_received`
- `partner_created`
- `partner_updated`
- `classification_assigned`
- `resources_assigned`
- `tracking_link_created`
- `manual_review_required`

### 4. Create Partner Resources database

Create a Notion database named `Partner Resources`.

Use it for assigned resources and recommended resource packs tied to `partner_id`.

### 5. Create Tracking Links database

Create a Notion database named `Tracking Links`.

Use it for partner-attributed tracking URLs, UTM fields, destination URLs, and campaign/source metadata.

### 6. Share each database with the integration

For each database:

1. Open the database as a full page.
2. Click `...` or `Share`.
3. Invite the `Partner Command Center` integration.
4. Confirm the integration has access.

No sharing, no API access. Notion will smile politely while returning errors like a bureaucrat in a cardigan.

### 7. Copy database IDs

Copy each database ID from its URL and set:

```text
NOTION_PARTNERS_DB_ID=
NOTION_PARTNER_EVENTS_DB_ID=
NOTION_PARTNER_RESOURCES_DB_ID=
NOTION_TRACKING_LINKS_DB_ID=
```

## Partner statuses

Use these canonical live statuses:

```text
new
intake_received
needs_review
approved
active
paused
rejected
archived
```

## Server-side only rule

All Notion calls must run server-side.

Allowed:

- `/lib/notion-client.js`
- `/api/router.js` in Sprint 02+
- serverless functions

Not allowed:

- Static browser JavaScript calling Notion directly.
- Exposing `NOTION_API_KEY` in `window.MoonshineOS`.
- Putting Notion tokens in HTML, CSS, public JSON, localStorage, or query strings.

## Example create Partner payload

```json
{
  "parent": {
    "database_id": "${NOTION_PARTNERS_DB_ID}"
  },
  "properties": {
    "Partner ID": {
      "rich_text": [{ "text": { "content": "MS-P-20260707-abc123" } }]
    },
    "Name": {
      "title": [{ "text": { "content": "Jordan Smith" } }]
    },
    "Email": {
      "email": "jordan@example.com"
    },
    "Phone": {
      "phone_number": "+15555550123"
    },
    "Company": {
      "rich_text": [{ "text": { "content": "Smith Funding Advisors" } }]
    },
    "Website": {
      "url": "https://example.com"
    },
    "Partner Type": {
      "select": { "name": "funding_broker" }
    },
    "Audience": {
      "rich_text": [{ "text": { "content": "Small business owners seeking working capital." } }]
    },
    "Status": {
      "select": { "name": "intake_received" }
    },
    "Tier": {
      "select": { "name": "manual_review" }
    },
    "Onboarding Path": {
      "select": { "name": "manual_review_path" }
    },
    "Created At": {
      "date": { "start": "2026-07-07T00:00:00.000Z" }
    },
    "Updated At": {
      "date": { "start": "2026-07-07T00:00:00.000Z" }
    }
  }
}
```

## Example Partner Event payload

```json
{
  "parent": {
    "database_id": "${NOTION_PARTNER_EVENTS_DB_ID}"
  },
  "properties": {
    "Event ID": {
      "title": [{ "text": { "content": "event_MS-P-20260707-abc123_signup_received" } }]
    },
    "Partner ID": {
      "rich_text": [{ "text": { "content": "MS-P-20260707-abc123" } }]
    },
    "Event Type": {
      "select": { "name": "signup_received" }
    },
    "Source": {
      "select": { "name": "tally" }
    },
    "Created At": {
      "date": { "start": "2026-07-07T00:00:00.000Z" }
    }
  }
}
```

## Sprint 01 files

| File | Purpose |
|---|---|
| `integrations/notion-partner-crm.md` | Setup and operating guide. |
| `integrations/notion-partner-database-schema.json` | Database/property blueprint. |
| `integrations/notion-partner-field-map.md` | Partner object to Notion field mapping. |
| `integrations/notion-env-vars.md` | Env var checklist and deployment notes. |
| `lib/notion-client.js` | Fetch-based server-side Notion client helpers. |
| `lib/partner-mappers.js` | Partner/event/resource/link payload mappers. |
| `lib/validation.js` | Required-field and sensitive-data validation helpers. |
| `lib/response.js` | JSON response helpers for future router/API use. |

## Manual verification checklist

- [ ] Four Notion databases exist.
- [ ] Required Partner properties exist exactly as named.
- [ ] Each database is shared with the integration.
- [ ] Database IDs are stored server-side only.
- [ ] `NOTION_API_KEY` is stored server-side only.
- [ ] No Notion credentials appear in static files.
- [ ] Helper modules use fetch and no package manager.
- [ ] Sprint 02 can import the helpers without adding endpoint sprawl.