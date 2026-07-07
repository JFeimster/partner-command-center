# Tally Partner Signup Integration

## Purpose

Sprint 02 creates the first live intake path:

```text
Tally partner signup
  -> POST /api/router
  -> receivePartnerSignup
  -> validate and normalize
  -> classify partner
  -> assign onboarding path
  -> assign starter resources/campaigns
  -> create/update Notion Partner record
  -> log Partner Event
  -> return partner_id
```

This is partner activation plumbing, not lead routing. Lead Submission + Funding Router still waits until Sprint 05.

## Endpoint

```text
POST /api/router
```

## Supported Sprint 02 actions

```text
receivePartnerSignup
createPartner
getPartner
classifyPartner
assignOnboardingPath
assignPartnerResources
logPartnerEvent
```

## Tally webhook setup

1. Create or open the Tally partner signup form.
2. Add the fields listed in `/modules/partner-intake/tally-intake-fields.md`.
3. Add a webhook integration.
4. Set the webhook URL to:

```text
https://YOUR_DOMAIN.com/api/router
```

5. Configure the event as `FORM_RESPONSE`.
6. Configure a shared secret if Tally supports one in your webhook setup.
7. Store the same value server-side as:

```text
TALLY_WEBHOOK_SECRET
```

8. Confirm Notion env vars from Sprint 01 are present.
9. Submit a test signup.
10. Confirm a Partner record and Partner Event are created in Notion.

## Authentication behavior

The router accepts either:

- A valid Tally webhook secret/signature for `receivePartnerSignup`.
- A valid `X-API-Key` header matching `PARTNER_COMMAND_API_KEY` for admin/manual/API tests.

Supported Tally-style secret/signature headers:

```text
x-tally-webhook-secret
x-webhook-secret
x-tally-signature
tally-signature
x-webhook-signature
```

The signature path expects an HMAC-SHA256 digest of the normalized body using `TALLY_WEBHOOK_SECRET`. Direct shared-secret headers are also accepted for simple webhook setups.

## Required request behavior

- Method must be `POST`.
- Response is JSON only.
- Unsupported actions are rejected.
- Sensitive data is rejected.
- Notion credentials stay server-side.
- Browser JavaScript never calls Notion directly.

## Sensitive data rejection

Do not send or store:

- SSNs.
- Full tax IDs.
- Bank credentials.
- Account numbers.
- Private documents.
- Underwriting decisions.
- Borrower financial documents.

If these show up in free-text fields, the router returns a validation error instead of storing the partner. Good. The CRM does not need cursed artifacts in the basement.

## Test payload for `receivePartnerSignup`

Use the full example in `tally-webhook-payload.json`.

Minimum manual test with API key:

```json
{
  "action": "receivePartnerSignup",
  "eventType": "FORM_RESPONSE",
  "data": {
    "responseId": "sub_test_001",
    "createdAt": "2026-07-07T00:00:00.000Z",
    "fields": [
      { "label": "First name", "value": "Jordan" },
      { "label": "Last name", "value": "Smith" },
      { "label": "Email", "value": "jordan@example.com" },
      { "label": "Company / brand", "value": "Smith Funding Advisors" },
      { "label": "Which best describes you?", "value": "Funding broker" },
      { "label": "Who do you serve?", "value": "Small business owners seeking working capital." },
      { "label": "What partner role are you most interested in?", "value": "Broker / funding advisor" },
      { "label": "Partner acknowledgment", "value": "I understand." },
      { "label": "Contact permission", "value": "I agree." }
    ]
  }
}
```

Headers:

```text
Content-Type: application/json
X-API-Key: YOUR_PARTNER_COMMAND_API_KEY
```

## Example successful response

```json
{
  "ok": true,
  "data": {
    "action": "receivePartnerSignup",
    "result": "created",
    "partner_id": "MS-P-20260707-ABC12345",
    "partner": {
      "partner_id": "MS-P-20260707-ABC12345",
      "name": "Jordan Smith",
      "email": "jordan@example.com",
      "company": "Smith Funding Advisors",
      "partner_type": "funding_broker",
      "audience": "Small business owners seeking working capital.",
      "status": "intake_received",
      "tier": "tier_1",
      "onboarding_path": "broker_fast_start"
    },
    "notion_page": {
      "id": "notion-page-id",
      "url": "https://www.notion.so/..."
    }
  }
}
```

## Router action list

### `receivePartnerSignup`

Primary Tally webhook path. Normalizes raw Tally field data, classifies partner, assigns onboarding/resources/campaigns, upserts Partner record in Notion, logs event, and returns `partner_id`.

### `createPartner`

Manual/admin API creation path. Requires `X-API-Key`.

### `getPartner`

Looks up a partner by `partner_id` or `email`.

### `classifyPartner`

Classifies a partner payload without creating a record.

### `assignOnboardingPath`

Returns onboarding path based on partner type and tier.

### `assignPartnerResources`

Creates assigned Partner Resource records in Notion for an existing `partner_id`.

### `logPartnerEvent`

Creates a Partner Event record in Notion.

## Manual verification checklist

- [ ] `POST /api/router` rejects non-POST methods.
- [ ] Missing auth returns unauthorized JSON.
- [ ] Invalid action returns validation JSON.
- [ ] Valid Tally/manual payload returns a `partner_id`.
- [ ] Partner appears in Notion Partners database.
- [ ] Partner Event appears in Notion Partner Events database.
- [ ] Sensitive data test payload is rejected.
- [ ] No Notion token appears in browser JavaScript.
- [ ] Lead submission remains unavailable until Sprint 05.