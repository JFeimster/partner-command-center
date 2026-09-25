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
  -> HubSpot contact + deal when configured
  -> optional Google Sheets sync webhook
```

A raw applicant notification is intentionally not converted into a fabricated full Funding Leads record in Notion. The canonical `/api/lead-router` still requires a complete funding-lead contract.

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

Optional applicant fan-out:

```text
HUBSPOT_PRIVATE_APP_TOKEN
GOOGLE_SHEETS_SYNC_WEBHOOK_URL
GOOGLE_SHEETS_SYNC_SECRET
```

Cloudflare Worker secret:

```text
PARTNER_COMMAND_API_KEY
```

Cloudflare Worker variable:

```text
INTAKE_API_BASE_URL=https://partner-command-center-rho.vercel.app
```
