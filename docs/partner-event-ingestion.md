# Partner Event Ingestion

## Purpose

`POST /api/partner-events` is the universal trusted intake surface for partner and affiliate lifecycle signals.

It is designed for events such as:

- forwarded broker-enrollment notification emails
- Tally partner-signup adapters
- provider enrollment notifications
- GPT/operator-created partner events
- HubSpot/Notion/Google Sheets automation events

The endpoint is **not** for borrower funding applications.

## Operation

```text
operationId: ingestPartnerEvent
POST /api/partner-events
```

Authentication accepts the existing Partner Command API credential through either:

```text
Authorization: Bearer <PARTNER_COMMAND_API_KEY>
X-API-Key: <PARTNER_COMMAND_API_KEY>
```

## Behavior

1. Build a deterministic event ID when `external_event_id` is supplied.
2. Reject a replay when the same Event ID already exists in the Partner Events database.
3. Resolve the partner by `partner_id`, then email.
4. If no partner exists, create a minimal affiliate partner using the supplied identity.
5. Write the Partner Event to Notion.
6. Return the resolved `partner_id`, partner storage action, and Notion page references.

## DAC email example

DAC broker notices may represent either a new enrollment or a welcome-email resend, so the email itself must be treated as an **event**, not proof that a new partner must be created.

```json
{
  "event_type": "partner_enrollment_notification",
  "source": "email",
  "provider": "david_allen_capital",
  "external_event_id": "provider-or-email-message-id",
  "partner": {
    "name": "Example Broker",
    "email": "broker@example.com",
    "phone": "+12025550142"
  },
  "summary": "DAC reported a broker enrollment or welcome-email resend.",
  "metadata": {
    "notification_type": "broker_enrollment_or_resend"
  }
}
```

## Current persistence

Primary write:

```text
Partner identity -> Notion Partners CRM
Partner event    -> Notion Partner Events
```

HubSpot and Google Sheets synchronization are intentionally separate priority Actions so a primary Notion write does not fail merely because a secondary CRM is unavailable.
