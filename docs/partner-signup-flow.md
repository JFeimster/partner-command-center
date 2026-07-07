# Partner Signup Flow

## Purpose

Define the first live workflow for Partner Command Center: **partner signup and activation**.

Lead routing is intentionally downstream. A partner must exist before the system accepts live partner-attributed leads.

## Canonical flow

```text
Tally partner signup
  -> API/router
  -> Notion Partner record
  -> partner_id
  -> onboarding path
  -> assigned resources
  -> dashboard access
  -> tracking links
  -> lead submission
```

## Step-by-step behavior

### 1. Tally partner signup

A partner completes the partner signup form in Tally.

Expected form intent:

- Identify the person or company.
- Capture contact details.
- Capture audience and referral context.
- Capture claimed partner type or desired role.
- Capture consent/acknowledgment.
- Avoid borrower-level underwriting data.

### 2. API/router receives signup

The future unified endpoint is:

```text
POST /api/router
```

Sprint 00 reserves `/api/router.js` as the live API gateway location. It does not create the file yet.

The future router action for this flow should be:

```text
receivePartnerSignup
```

### 3. Validate and normalize

The future router should validate:

- Request method.
- Webhook secret/signature.
- Required contact fields.
- Safe text content.
- Field map compatibility.

The future router should reject or flag sensitive data such as SSNs, full tax IDs, bank credentials, account numbers, private documents, or underwriting decisions.

### 4. Create or update Notion Partner record

Notion is the first live CRM/database layer.

The Partner record should store activation state, not just contact information. This prevents the classic CRM graveyard problem: names in a database, nobody knows what to do next. 🪦

### 5. Generate or preserve `partner_id`

If a stable `partner_id` already exists, preserve it.

If none exists, generate one during the live intake flow.

Recommended future format:

```text
MS-P-{timestamp/hash}
```

### 6. Assign classification and onboarding context

The system should assign:

- Partner type.
- Tier or review state.
- Onboarding path.
- Recommended resources.
- Starter campaign recommendations.
- Next action.

### 7. Enable dashboard access

The partner dashboard should use `partner_id` and partner profile context to load partner-specific views.

Affected surfaces:

- Partner access.
- Welcome.
- Dashboard overview.
- Onboarding.
- Partner ID.
- Resources.
- Partner links.

### 8. Create tracking-link capability

After activation, the partner can build and use partner-aware tracking links.

Tracking links must use `partner_id` for attribution.

### 9. Allow lead submission later

Lead submission comes after partner activation.

Future live lead submissions must be tied to `partner_id`. If `partner_id` is missing, the live router should reject the request.

## Status model for this sprint

Sprint 00 is a documentation and source-of-truth sprint only.

| Area | Sprint 00 status |
|---|---|
| Tally form | Referenced only |
| API router | Reserved only |
| Notion CRM | Planned only |
| Partner ID | Defined as required live dependency |
| Dashboard activation | Defined as downstream surface |
| Lead submission | Explicitly deferred |

## Source references

Use `partner-intake-os` as the source/reference library for intake shape, classification concepts, onboarding concepts, and Tally field guidance.

Use `partner-command-center` as the live product shell where partners sign up, access the dashboard, get resources, build tracking links, and later submit leads.