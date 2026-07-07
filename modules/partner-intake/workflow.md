# Partner Intake Workflow

## Workflow name

Partner Signup + Activation

## Workflow status

Sprint 00 defines the workflow contract only. No live API code is added in this sprint.

## Primary correction

The first live workflow is not lead routing.

The first live workflow is:

```text
partner signup -> partner record -> partner_id -> activation context -> dashboard access
```

Lead submission happens after activation.

## Inputs

The future live workflow consumes:

- Tally partner signup payload.
- Tally submission metadata.
- Contact fields.
- Claimed partner type or desired partner role.
- Audience/referral context.
- Consent/acknowledgment fields.
- Optional traffic source/referral source.

## Processing stages

### Stage 1 — Receive signup

Tally sends a partner signup event to the future unified router:

```text
POST /api/router
```

Expected action:

```text
receivePartnerSignup
```

### Stage 2 — Validate request

Future validation should check:

- Request method.
- Secret/signature.
- Required contact fields.
- Safe text fields.
- Payload shape.
- Duplicate identifiers where available.

### Stage 3 — Normalize partner object

Normalize raw Tally fields into the Partner Command Center partner data object.

Core normalized fields:

- `partner_id`
- `name`
- `email`
- `phone`
- `company`
- `website`
- `partner_type`
- `audience`
- `referral_source`
- `traffic_source`
- `status`
- `tier`
- `onboarding_path`
- `resource_recommendations`
- `campaign_recommendations`
- `tally_submission_id`
- `created_at`
- `updated_at`

### Stage 4 — Create/update Notion Partner record

The future router creates or updates the Partner record in Notion.

Notion is the first live CRM/database layer.

### Stage 5 — Create/preserve partner ID

If no `partner_id` exists, generate one.

Future recommended format:

```text
MS-P-{timestamp/hash}
```

The `partner_id` becomes the key for:

- Dashboard access.
- Tracking links.
- Partner events.
- Resource assignment.
- Future lead attribution.

### Stage 6 — Assign partner context

Use reference logic from `partner-intake-os` to determine:

- Partner type.
- Partner tier.
- Onboarding path.
- Resource recommendations.
- Campaign recommendations.
- Manual review needs.
- Next action.

### Stage 7 — Activate dashboard context

The dashboard should be able to load the partner profile by email or `partner_id` in a future live mode.

Partner-facing display should avoid exposing internal review reasoning, risk flags, raw webhook payloads, or private notes.

### Stage 8 — Enable tracking links

Activated partners should be able to create partner-aware tracking links.

Tracking links must use `partner_id`.

### Stage 9 — Defer lead submission

Lead submission remains downstream.

Future live rule:

```text
if partner_id is missing -> reject lead submission
```

## Failure handling principles

| Failure | Required behavior |
|---|---|
| Missing contact fields | Route to validation error or manual review. |
| Missing `partner_id` during activation | Generate one if safe. |
| Missing `partner_id` during lead submission | Reject the future lead submission. |
| Notion unavailable | Return a real error in live mode. Do not fake success. |
| Sensitive data submitted | Reject or redact according to later validation rules. |
| Partner type unclear | Use manual review path. |
| Compliance-risk claims | Flag for manual review; do not auto-activate. |

## Downstream router actions reserved for later sprints

Sprint 02+ may implement:

- `receivePartnerSignup`
- `createPartner`
- `getPartner`
- `classifyPartner`
- `assignOnboardingPath`
- `assignPartnerResources`
- `logPartnerEvent`

Sprint 04+ may implement:

- `createTrackingLink`
- `listTrackingLinks`
- `recommendResources`
- `assignResources`

Sprint 05+ may implement:

- `submitLead`
- `listLeads`
- `getLeadStatus`
- `updateLeadStatus`
- `recommendFundingPath`

## Compliance boundary

This workflow does not approve partners automatically, promise revenue, imply guaranteed funding, or make underwriting decisions.

Partner activation means the system has enough context to route onboarding and tools. It does not mean the partner, their referrals, or their future leads are guaranteed outcomes.