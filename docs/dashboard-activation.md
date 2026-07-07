# Partner Access + Dashboard Activation

## Purpose

Sprint 03 connects Partner Command Center's partner access, welcome, and dashboard surfaces to partner activation context.

It keeps the default experience as local demo mode, but adds a live mode that can load a sanitized Partner profile through the unified API router without putting secrets in browser JavaScript.

## Activation order

```text
Tally partner signup
  -> /api/router receivePartnerSignup
  -> Notion Partner record
  -> partner_id
  -> /api/router getPartnerActivation
  -> browser stores sanitized partner profile
  -> welcome page renders activation context
  -> dashboard uses activated partner profile
```

## Modes

### Local mode

Default mode.

```text
api.mode = local
```

Behavior:

- Partner access form saves a local demo profile.
- Welcome reads local profile.
- Dashboard hydrates local profile/state.
- No API request is required.
- No live CRM status is implied.

### Live mode

Enabled by URL or local setting.

```text
?api_mode=live
?mode=live
?live=1
```

Behavior:

- Partner access form attempts a live activation lookup.
- The browser calls `/api/router` with action `getPartnerActivation`.
- The router returns a sanitized Partner profile only.
- The browser stores that sanitized profile in localStorage for welcome/dashboard rendering.
- No API key or Notion secret is stored in the browser.

## Public activation action

Sprint 03 adds this router action:

```text
getPartnerActivation
```

Request:

```json
{
  "action": "getPartnerActivation",
  "partner_id": "MS-P-20260707-ABC12345"
}
```

or:

```json
{
  "action": "getPartnerActivation",
  "email": "partner@example.com"
}
```

Response shape:

```json
{
  "ok": true,
  "data": {
    "action": "getPartnerActivation",
    "partner_id": "MS-P-20260707-ABC12345",
    "partner": {
      "partner_id": "MS-P-20260707-ABC12345",
      "name": "Jordan Smith",
      "email": "partner@example.com",
      "company": "Smith Funding Advisors",
      "partner_type": "funding_broker",
      "audience": "Small business owners seeking working capital.",
      "status": "intake_received",
      "tier": "tier_1",
      "onboarding_path": "broker_fast_start",
      "resource_recommendations": [],
      "campaign_recommendations": []
    }
  }
}
```

## Browser storage shape

The activation client stores the sanitized profile under:

```text
moonshine.partnerOS.partnerProfile
```

Example browser profile:

```json
{
  "partnerId": "MS-P-20260707-ABC12345",
  "contactName": "Jordan Smith",
  "email": "partner@example.com",
  "company": "Smith Funding Advisors",
  "partnerType": "funding_broker",
  "primaryAudience": "Small business owners seeking working capital.",
  "status": "intake_received",
  "tier": "tier_1",
  "onboardingPath": "broker_fast_start",
  "resourceRecommendations": [],
  "campaignRecommendations": [],
  "localDemo": false,
  "liveMode": true,
  "activationSource": "api-router"
}
```

## Security boundary

Allowed in browser:

- `partner_id`
- Display name
- Email used for lookup
- Company
- Partner type
- Audience
- Status
- Tier
- Onboarding path
- Assigned resource/campaign labels

Not allowed in browser:

- `NOTION_API_KEY`
- `PARTNER_COMMAND_API_KEY`
- Raw Notion pages
- Webhook secrets
- Internal review notes
- Risk scoring internals
- Raw Tally payloads
- Sensitive submitted data

## Updated surfaces

### Partner Access

In local mode, the existing local profile behavior remains.

In live mode, the submit event is intercepted before local demo submission. The page attempts to look up the partner by email or partner ID through `getPartnerActivation`.

### Welcome

The welcome page now distinguishes local demo profile from live partner profile and renders live status/onboarding/resource context when available.

### Dashboard

The dashboard continues to hydrate from `partnerProfile`; Sprint 03 changes the source of that profile when live activation succeeds.

Lead submission remains demo/local. The lead router is still deferred until Sprint 05.

## Manual verification checklist

- [ ] Local mode still creates and loads a local demo profile.
- [ ] `?api_mode=live` persists live mode in localStorage.
- [ ] Live mode does not require or expose `X-API-Key` in the browser.
- [ ] `/api/router` supports `getPartnerActivation`.
- [ ] `getPartnerActivation` returns sanitized profile data only.
- [ ] Welcome page shows live profile wording when `profile.liveMode` is true.
- [ ] Dashboard reads the live-activated profile from `partnerProfile`.
- [ ] Lead submission remains demo/local only.
- [ ] No Notion secret appears in HTML, client JS, localStorage, or query strings.