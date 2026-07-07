# Partner Intake Data Contract

## Purpose

Define the partner data object that Partner Command Center will use for the live signup and activation workflow.

This contract is intentionally implementation-ready, but Sprint 00 does not add live API code.

## Partner data object

```json
{
  "partner_id": "MS-P-20260707-abc123",
  "name": "Jordan Smith",
  "email": "jordan@example.com",
  "phone": "+15555550123",
  "company": "Smith Funding Advisors",
  "website": "https://example.com",
  "partner_type": "funding_broker",
  "audience": "Small business owners seeking working capital and growth funding.",
  "referral_source": "tally_partner_signup",
  "traffic_source": "organic",
  "status": "intake_received",
  "tier": "manual_review",
  "onboarding_path": "manual_review_path",
  "resource_recommendations": [],
  "campaign_recommendations": [],
  "tally_submission_id": "sub_123456",
  "created_at": "2026-07-07T00:00:00.000Z",
  "updated_at": "2026-07-07T00:00:00.000Z"
}
```

## Required fields for live activation

| Field | Required? | Notes |
|---|---:|---|
| `partner_id` | Yes | Generated or preserved by the system before live dashboard attribution. |
| `name` | Yes | Display name for dashboard/welcome. |
| `email` | Yes | Primary lookup and contact field. |
| `phone` | No | Useful for high-fit/manual-review follow-up. |
| `company` | No | Company, agency, brand, organization, or individual identity. |
| `website` | No | Website, LinkedIn, community page, or relevant profile. |
| `partner_type` | Yes | System classification, not just claimed type. |
| `audience` | Yes | Who the partner can reach or serve. |
| `referral_source` | No | Source of signup or referral context. |
| `traffic_source` | No | Marketing/traffic attribution source. |
| `status` | Yes | Lifecycle state. |
| `tier` | Yes | Activation/review tier. |
| `onboarding_path` | Yes | Determines welcome and checklist path. |
| `resource_recommendations` | No | Array of resources assigned or recommended. |
| `campaign_recommendations` | No | Array of starter campaigns assigned or recommended. |
| `tally_submission_id` | No | Used for duplicate detection and traceability. |
| `created_at` | Yes | ISO timestamp. |
| `updated_at` | Yes | ISO timestamp. |

## Partner statuses

Use these live statuses in later sprints:

```text
new
intake_received
needs_review
approved
active
paused
rejected
archived
```

## Partner types

Use these live-facing partner types for the first router implementation:

```text
funding_broker
referral_partner
affiliate_partner
center_of_influence
professional_service_provider
community_connector
internal_operator
unknown
```

Partner Intake OS has a deeper enum set. Partner Command Center should map the deeper reference values into this cleaner live shell unless a later sprint needs more granularity.

## Onboarding paths

Use these live onboarding paths for the first router implementation:

```text
broker_fast_start
affiliate_launch_path
referral_partner_path
coi_relationship_path
manual_review_path
```

## Dashboard-safe subset

Partner-facing dashboard views may safely display:

- `partner_id`
- `name`
- `company`
- `partner_type`
- `audience`
- `status`
- `tier` when partner-facing language is appropriate
- `onboarding_path`
- `resource_recommendations`
- `campaign_recommendations`
- partner tracking links created from `partner_id`

## Internal-only fields

Do not expose these directly in partner-facing dashboard views:

- Raw Tally payload.
- Webhook signature data.
- API keys or secrets.
- Risk scoring internals.
- Reviewer notes.
- Rejection rationale before review policy exists.
- Sensitive submitted data.
- Internal Notion page IDs unless needed for server-side operations.

## Sensitive data rule

The partner signup flow must not store or request:

- SSNs.
- Full tax IDs.
- Bank credentials.
- Account numbers.
- Private documents.
- Underwriting decisions.
- Borrower financial documents.

If these appear in free-text fields, later live validation should reject, redact, or route the payload to manual review according to the Sprint 01/02 implementation.

## Lead dependency

Every future live lead object must include:

```json
{
  "partner_id": "MS-P-20260707-abc123"
}
```

Without `partner_id`, the future live Lead Submission + Funding Router should reject the lead. Guessing attribution is how CRMs become haunted houses.