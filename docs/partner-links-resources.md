# Partner Link Builder + Resource Assignment

## Purpose

Sprint 04 connects the partner dashboard link builder and resource recommendations to the live partner activation model.

This sprint keeps browser behavior safe:

- Browser pages may build links and queue link/resource intent locally.
- Browser pages do **not** store API keys.
- Browser pages do **not** write directly to Notion.
- Trusted server/API calls create Notion Tracking Link and Partner Resource records.

## Link flow

```text
Activated partner profile
  -> dashboard link builder
  -> tracking URL generated with partner_id + UTM fields
  -> browser queues tracking intent locally
  -> trusted API call writes Tracking Links database
  -> Partner Event records tracking_link_created
```

## Resource flow

```text
Activated partner profile
  -> resourceRecommendations / onboardingPath
  -> browser can queue resource assignment intent
  -> trusted router/API call writes Partner Resources database
  -> Partner Event records resources_assigned
```

## Browser safety rule

The browser is allowed to store:

- `partnerId`
- Destination URL
- Tracking URL
- UTM source / medium / campaign
- Resource labels
- Queued sync intent

The browser is not allowed to store:

- `PARTNER_COMMAND_API_KEY`
- `NOTION_API_KEY`
- Notion database IDs as operational secrets
- Webhook secrets
- Raw Notion pages
- Internal review notes

No client-side key buffet. That is how dashboards become piñatas.

## New client file

```text
scripts/live-ops.js
```

Responsibilities:

- Detect live/local mode.
- Read activated partner profile.
- Build tracking-link payloads.
- Queue tracking link intent locally.
- Queue resource assignment intent locally.
- Bind dashboard link-builder submit events.
- Bind marketplace link-copy events.
- Expose `window.MoonshineOS.liveOps`.

## Trusted tracking link endpoint

```text
POST /api/partner-links
```

Headers:

```text
Content-Type: application/json
X-API-Key: YOUR_PARTNER_COMMAND_API_KEY
```

Request:

```json
{
  "partner_id": "MS-P-20260707-ABC12345",
  "destination_url": "https://distilledfunding.com/partners",
  "tracking_url": "https://distilledfunding.com/partners?partner_id=MS-P-20260707-ABC12345&utm_source=dashboard&utm_medium=partner_dashboard&utm_campaign=affiliate_launch",
  "source": "dashboard",
  "medium": "partner_dashboard",
  "campaign": "affiliate_launch",
  "utm_source": "dashboard",
  "utm_medium": "partner_dashboard",
  "utm_campaign": "affiliate_launch",
  "status": "active"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "action": "createPartnerTrackingLink",
    "partner_id": "MS-P-20260707-ABC12345",
    "tracking_link": {
      "tracking_link_id": "link_MS-P-20260707-ABC12345_1234567890",
      "destination_url": "https://distilledfunding.com/partners",
      "tracking_url": "https://distilledfunding.com/partners?partner_id=MS-P-20260707-ABC12345&utm_source=dashboard&utm_medium=partner_dashboard&utm_campaign=affiliate_launch"
    }
  }
}
```

## Existing trusted resource action

Sprint 02 already introduced router resource assignment:

```text
POST /api/router
```

Trusted body:

```json
{
  "action": "assignPartnerResources",
  "partner": {
    "partner_id": "MS-P-20260707-ABC12345",
    "partner_type": "funding_broker",
    "onboarding_path": "broker_fast_start"
  },
  "resources": [
    "Partner Program Overview",
    "Compliance-Safe Referral Rules",
    "Broker Fast Start Checklist",
    "Deal Handoff Playbook",
    "Partner Link Setup Guide"
  ]
}
```

Headers:

```text
Content-Type: application/json
X-API-Key: YOUR_PARTNER_COMMAND_API_KEY
```

## Local queued storage

Sprint 04 stores browser-side intent under:

```text
moonshine.partnerOS.trackingLinks
moonshine.partnerOS.resourceAssignments
```

Queued records are not CRM records. They are browser-side sync intent only.

## Manual verification checklist

- [ ] Dashboard still builds local partner links in local mode.
- [ ] `scripts/live-ops.js` loads automatically from `scripts/config.js`.
- [ ] Submitting the dashboard link-builder form queues a tracking link intent locally.
- [ ] Copying a marketplace link queues a tracking link intent locally.
- [ ] No API key is stored in browser localStorage.
- [ ] `POST /api/partner-links` rejects requests without `X-API-Key`.
- [ ] `POST /api/partner-links` verifies the partner exists before writing a Tracking Link record.
- [ ] Trusted tracking link write creates a Tracking Links database record.
- [ ] Trusted tracking link write logs a Partner Event.
- [ ] Trusted resource assignment continues to use server-side Notion helpers.

## Sprint 04 boundary

Sprint 04 does not add a full authenticated partner session. Until a signed session exists, browser actions queue intent and trusted API calls perform database writes.