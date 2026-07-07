# Partner Intake Dashboard Spec

## Purpose

Define the dashboard surfaces affected by the first live workflow: partner signup and activation.

Sprint 00 does not update dashboard code. It defines what Sprint 03 must connect once Sprint 01 and Sprint 02 create the Notion/API foundation.

## Dashboard activation rule

The dashboard becomes live only after the system can load partner profile context by `partner_id` or verified lookup.

Live mode must not pretend a failed backend call succeeded. Demo mode can be local. Live mode needs receipts.

## Required dashboard surfaces

### 1. Partner access

Purpose:

- Let a partner enter email or `partner_id`.
- In later live mode, look up or create partner context through `/api/router.js`.
- Route to welcome/dashboard only after a valid response.

Expected live behavior later:

```text
email/partner_id -> API/router -> Partner record -> session/local profile context -> welcome/dashboard
```

### 2. Welcome

Purpose:

- Confirm partner signup was received.
- Show the assigned or pending onboarding path.
- Display next action.
- Route partner toward dashboard, resources, or review instructions.

Partner-facing tone:

- Clear.
- Operational.
- No guarantee language.
- No fake approval language.

### 3. Dashboard overview

Purpose:

- Show partner identity and activation status.
- Show partner type.
- Show onboarding progress.
- Show assigned resources and recommended next action.
- Show whether live mode or local demo mode is active.

### 4. Onboarding

Purpose:

- Render checklist from `onboarding_path`.
- Track completion state locally or through future live API.
- Keep manual-review partners from receiving inappropriate launch actions too early.

Example path behavior:

| Onboarding path | Dashboard implication |
|---|---|
| `broker_fast_start` | Show broker launch checklist, partner link setup, and lead handoff training. |
| `affiliate_launch_path` | Show affiliate campaign resources and tracking-link setup. |
| `referral_partner_path` | Show referral education, handoff rules, and resource basics. |
| `coi_relationship_path` | Show relationship-based referral guidance and intro scripts. |
| `manual_review_path` | Show review status, missing info prompts, and safe resources only. |

### 5. Partner ID

Purpose:

- Display live `partner_id`.
- Explain that `partner_id` powers attribution, links, events, and future lead routing.
- Never invent a fake live partner ID in live mode.

### 6. Resources

Purpose:

- Render assigned resources based on partner type and onboarding path.
- Distinguish between demo resources and live assigned resources.
- Avoid displaying internal review notes.

### 7. Partner links

Purpose:

- Build tracking links using `partner_id`.
- Include source/campaign fields later.
- Copy/share links from dashboard.
- Store created links in Notion later.

### 8. Settings

Purpose:

- Show partner profile fields.
- Let future partners confirm/update basic non-sensitive profile fields.
- Show local/live mode state.
- Provide reset/demo controls only in local mode.

## Future config requirement

Sprint 03 should add or update:

```js
window.MoonshineOS.config.api.mode = "local" | "live";
```

Mode behavior:

| Mode | Behavior |
|---|---|
| `local` | Use local demo state and sample data. |
| `live` | Call `/api/router.js` and show real errors if calls fail. |

## Data needed by dashboard

The dashboard should eventually receive:

```json
{
  "partner": {
    "partner_id": "MS-P-20260707-abc123",
    "name": "Jordan Smith",
    "email": "jordan@example.com",
    "company": "Smith Funding Advisors",
    "partner_type": "funding_broker",
    "status": "intake_received",
    "tier": "manual_review",
    "onboarding_path": "manual_review_path"
  },
  "resources": [],
  "campaigns": [],
  "tracking_links": [],
  "events": []
}
```

## Error behavior

Live mode must show real user-facing errors for:

- Partner not found.
- API unavailable.
- Notion unavailable.
- Unauthorized request.
- Validation failure.
- Missing `partner_id`.

Do not silently fall back to fake success in live mode.

## Lead tracker dependency

Lead tracker surfaces should stay demo/local until Sprint 05.

Future live lead tracker must filter by `partner_id`. If `partner_id` is missing, it should show an access/activation error instead of displaying unrelated leads.

## Acceptance criteria for later Sprint 03

Sprint 03 is ready when:

- Partner access can resolve live partner context.
- Welcome page displays onboarding path.
- Dashboard overview loads partner profile.
- Onboarding reflects assigned path.
- Resources reflect assigned resources.
- Partner ID is visible.
- Partner links use live `partner_id`.
- Failed live calls show real errors.
- Demo mode remains available for local review.