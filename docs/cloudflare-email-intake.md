# Cloudflare Email Intake

## Goal

Allow an operator to forward a recent email from their normal mailbox to one Cloudflare-routed address without relying on Gmail labels, Gmail polling, n8n, or HubSpot inbox automation.

## Primary flow

```text
Operator forwards email
  -> intake@YOUR_DOMAIN
  -> Cloudflare Email Routing
  -> workers/email-intake
  -> POST /api/intake-message
  -> classify partner | applicant | unknown
```

### Partner

```text
/api/intake-message
  -> /api/partner-email-ingest
  -> /api/partner-events
  -> Notion Partners + Partner Events
```

Existing partner CRM sync remains available through `/api/partner-sync`.

### Applicant

```text
/api/intake-message
  -> /api/applicant-email-ingest
  -> parse applicant identity + funding facts
  -> HubSpot contact upsert
  -> HubSpot funding deal upsert
  -> Notion Funding Leads upsert
  -> Google Sheets applicant sync webhook
```

Applicant email intake now converges on existing records instead of creating a new record for every forwarded notification:

- HubSpot contacts are resolved by normalized email before create.
- HubSpot funding deals are searched and updated when a matching applicant deal exists; otherwise a deal is created when HubSpot deal access is configured.
- Notion Funding Leads are resolved by applicant email. The same Funding Lead is updated when possible; duplicate-email conflicts are returned for review instead of guessed.
- Google Sheets receives `action: upsert_applicant_notification` with the normalized applicant plus HubSpot and Notion record IDs in the context object.
- Source event/message IDs are retained for replay detection and auditability.

The email parser writes only high-confidence structured fields. Existing lifecycle fields are preserved on later notifications rather than being reset by a routine forwarded email.

### Unknown

Unknown messages return:

```json
{
  "ok": true,
  "data": {
    "result": "review_required"
  }
}
```

They are not guessed into the wrong CRM domain.

## Backup workflows

The same endpoint can be called without email infrastructure.

### ChatGPT / GPT Action

Paste the message into ChatGPT and call `routeIntakeMessage` through the Partner Operations Action schema.

### Direct API

```bash
curl -X POST https://partner-command-center-rho.vercel.app/api/intake-message \
  -H "Authorization: Bearer $PARTNER_COMMAND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Forwarded notification",
    "raw_text": "paste the message here"
  }'
```

### Explicit override

When the operator already knows the type:

```json
{
  "type": "partner",
  "raw_text": "..."
}
```

or

```json
{
  "type": "applicant",
  "raw_text": "..."
}
```

## No n8n dependency

The old Funding Applicant OS n8n workflow files remain reference material only. This Cloudflare/Vercel path does not require n8n.

## Environment

Vercel already requires `PARTNER_COMMAND_API_KEY`.

Applicant persistence configuration:

```text
HUBSPOT_PRIVATE_APP_TOKEN
NOTION_API_KEY
NOTION_FUNDING_LEADS_DB_ID
GOOGLE_SHEETS_SYNC_WEBHOOK_URL
GOOGLE_SHEETS_SYNC_SECRET
```

If a destination is not configured or rejects a write, the other destinations continue processing. The API response and Vercel runtime log include per-destination status for `hubspot_contact`, `hubspot_deal`, `notion`, and `google_sheets`.

### Runtime observability

Each applicant intake emits one compact production log event:

```text
[applicant-email-ingest] {
  event_id,
  result,
  destinations: {
    hubspot_contact,
    hubspot_deal,
    notion,
    google_sheets
  },
  failed_systems
}
```

The log intentionally excludes applicant name, email, phone, and raw email text. Google Sheets receiver diagnostics are reduced to safe fields such as HTTP status, action/result, row/record ID, and error/message when the receiver provides them.

A public, secret-free configuration health check is available at:

```text
GET /api/intake-health
```

It reports only whether the HubSpot, Notion, and Google Sheets destinations are configured. It never exposes tokens, webhook URLs, or secret values.

When one or more persistence destinations are absent, applicant ingestion returns `accepted_with_gaps` and lists them in `unavailable_systems` instead of reporting a misleading fully-successful result.

Cloudflare Worker secret:

```text
PARTNER_COMMAND_API_KEY
```

Cloudflare Worker variable:

```text
INTAKE_API_BASE_URL=https://partner-command-center-rho.vercel.app
```
