# Dashboard Data Mode — Setup and Test Guide

## Modes

### Demo / localStorage

Default mode. Existing partner profile, demo leads, notes, favorites, training progress, events, and theme preferences stay in the current browser.

Open:

```text
/dashboard?dashboard_mode=demo
```

### Live API

Loads a partner-isolated dashboard projection from:

```text
GET /api/dashboard/bootstrap
```

Open with an existing signed dashboard session cookie:

```text
/dashboard?dashboard_mode=live
```

A signed one-time token may also be supplied as `dashboard_token`; the browser stores it in `sessionStorage` and immediately removes it from the visible URL.

## Required environment variables

Existing Notion variables:

```env
NOTION_API_KEY
NOTION_PARTNERS_DB_ID
NOTION_PARTNER_EVENTS_DB_ID
NOTION_PARTNER_RESOURCES_DB_ID
NOTION_TRACKING_LINKS_DB_ID
NOTION_FUNDING_LEADS_DB_ID
```

Dashboard session signing:

```env
DASHBOARD_SESSION_SECRET
```

Trusted operator/API tests continue to use:

```env
PARTNER_COMMAND_API_KEY
```

Optional commission planning rate:

```env
DASHBOARD_COMMISSION_ESTIMATE_RATE=0.02
```

The rate is optional. When omitted, the dashboard displays only explicit commission estimates already stored on lead records. Estimated values are never labeled as payable or verified commissions.

Preview-only unsigned partner lookup is disabled by default. It may be enabled only outside production:

```env
DASHBOARD_ALLOW_UNSIGNED_PARTNER_ID=true
```

## Signed session token format

The endpoint accepts a token containing:

```json
{
  "partner_id": "MS-P-1001",
  "exp": 1783719000
}
```

Encode the JSON with base64url and sign the encoded payload using HMAC-SHA256 with `DASHBOARD_SESSION_SECRET`:

```text
base64url(payload_json).base64url(hmac_sha256(encoded_payload))
```

The same token may be sent through:

- `Authorization: Bearer <token>`
- `pcc_partner_session=<token>` cookie
- one-time `dashboard_token` query parameter

## Trusted API curl

```bash
curl -sS \
  "https://partner-command-center-rho.vercel.app/api/dashboard/bootstrap?partner_id=MS-P-1001&limit=25" \
  -H "X-API-Key: $PARTNER_COMMAND_API_KEY" \
  -H "X-Partner-ID: MS-P-1001" \
  -H "Accept: application/json"
```

Expected:

- HTTP `200`
- `X-Dashboard-Mode: live`
- one partner profile
- only records belonging to the resolved partner
- no raw Notion page IDs when a stable external ID exists
- no SSNs, tax IDs, bank data, document contents, provider compensation, or internal review notes

## Browser test

1. Open `/dashboard?dashboard_mode=demo`.
2. Confirm the mode selector reads **Demo / localStorage**.
3. Add a demo lead and reload the page.
4. Confirm the lead remains in localStorage.
5. Switch the selector to **Live API**.
6. Without a signed session, confirm a safe authorization warning appears and demo data remains available.
7. Open the page with a valid signed partner token.
8. Confirm the partner profile, onboarding percentage, lead statuses, tracking links, resources, commission estimates, alerts, and activity load.
9. Confirm live lead status controls are disabled and remove buttons are hidden.
10. Submit the live lead form and confirm it routes to Am I Fundable with partner attribution instead of writing an incomplete funding lead.

## Automated tests

```bash
node tests/dashboard-data-mode.test.js
```

Coverage:

- partner status normalization
- lead status normalization
- onboarding projection
- Funding Lead public projection
- partner isolation checks
- commission estimate behavior
- signed-session verification
- trusted API-key identity resolution
- absence of applicant contact fields in dashboard lead projections

## Screenshots

- `docs/screenshots/dashboard-data-mode-desktop.png`
- `docs/screenshots/dashboard-data-mode-mobile.png`

The screenshots are captured from the Vercel preview deployment in demo/localStorage mode. Live mode requires a signed partner session and is validated through the authenticated endpoint and browser instructions above.

## Rollback

Revert the implementation PR. The existing localStorage dashboard remains the baseline and no Notion schema or Vercel deployment configuration is modified by this change.
