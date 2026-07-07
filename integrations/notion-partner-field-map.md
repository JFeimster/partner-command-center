# Notion Partner Field Map

## Purpose

Map Partner Command Center's normalized partner object into the Notion Partners database.

This field map keeps the live CRM layer stable when Sprint 02 starts receiving Tally signup payloads through `/api/router.js`.

## Normalized partner object

```json
{
  "partner_id": "MS-P-20260707-abc123",
  "name": "Jordan Smith",
  "email": "jordan@example.com",
  "phone": "+15555550123",
  "company": "Smith Funding Advisors",
  "website": "https://example.com",
  "partner_type": "funding_broker",
  "audience": "Small business owners seeking working capital.",
  "referral_source": "tally_partner_signup",
  "traffic_source": "organic",
  "status": "intake_received",
  "tier": "manual_review",
  "onboarding_path": "manual_review_path",
  "resource_recommendations": ["Partner Fast Start Guide"],
  "campaign_recommendations": ["Referral Partner Launch Campaign"],
  "tally_submission_id": "sub_123456",
  "created_at": "2026-07-07T00:00:00.000Z",
  "updated_at": "2026-07-07T00:00:00.000Z"
}
```

## Partners database map

| Partner object field | Notion property | Notion type | Required | Notes |
|---|---|---|---:|---|
| `name` | `Name` | title | Yes | Display name. Use company if name is missing only in manual-review flows. |
| `partner_id` | `Partner ID` | rich_text | Yes | Stable ID for dashboard, tracking links, events, and future lead attribution. |
| `email` | `Email` | email | Yes | Primary lookup field. |
| `phone` | `Phone` | phone_number | No | Keep optional. |
| `company` | `Company` | rich_text | No | Company, brand, agency, organization, or DBA. |
| `website` | `Website` | url | No | Public website/profile URL. |
| `partner_type` | `Partner Type` | select | Yes | Use canonical live enum. |
| `audience` | `Audience` | rich_text | Yes | Who the partner serves/reaches. |
| `referral_source` | `Referral Source` | rich_text | No | Source context, referral name, campaign, or form source. |
| `traffic_source` | `Traffic Source` | rich_text | No | Marketing source if known. |
| `status` | `Status` | select | Yes | One of the canonical partner statuses. |
| `tier` | `Tier` | select | Yes | Tier/review class. |
| `onboarding_path` | `Onboarding Path` | select | Yes | Determines dashboard onboarding. |
| `resource_recommendations` | `Resource Recommendations` | multi_select | No | Use short resource labels, not long descriptions. |
| `campaign_recommendations` | `Campaign Recommendations` | multi_select | No | Use campaign labels. |
| `tally_submission_id` | `Tally Submission ID` | rich_text | No | Useful for dedupe and traceability. |
| `created_at` | `Created At` | date | Yes | ISO timestamp. |
| `updated_at` | `Updated At` | date | Yes | ISO timestamp. |

## Partner status map

| Status | Use when |
|---|---|
| `new` | Record was manually seeded or created before intake processing completed. |
| `intake_received` | Signup payload was received and normalized. |
| `needs_review` | Manual/admin review is required before activation. |
| `approved` | Partner has passed review but is not fully active. |
| `active` | Partner can use live dashboard features and tracking links. |
| `paused` | Partner remains known but live use is paused. |
| `rejected` | Partner is not accepted for activation. |
| `archived` | Historical record retained; not active. |

## Partner type map

| Live value | Use for |
|---|---|
| `funding_broker` | Funding brokers, ISOs, commercial finance advisors. |
| `referral_partner` | Warm referral partners with client/business-owner relationships. |
| `affiliate_partner` | Creators, publishers, email/community operators, media partners. |
| `center_of_influence` | CPAs, bookkeepers, attorneys, business brokers, local connectors. |
| `professional_service_provider` | Service professionals whose audience includes business owners. |
| `community_connector` | Veteran groups, local business groups, trade/community networks. |
| `internal_operator` | Internal team/operator test or admin partner profiles. |
| `unknown` | Not enough signal yet; route to manual review. |

## Onboarding path map

| Path | Use for |
|---|---|
| `broker_fast_start` | Funding brokers or advisors ready to send/refine deal flow. |
| `affiliate_launch_path` | Partners who need links, campaign assets, and content prompts. |
| `referral_partner_path` | Partners who need referral education and safe handoff instructions. |
| `coi_relationship_path` | Centers of influence who need relationship-first intro resources. |
| `manual_review_path` | Unclear, risky, strategic, or incomplete partner records. |

## Partner Events map

| Event field | Notion property | Type |
|---|---|---|
| `event_id` | `Event ID` | title |
| `partner_id` | `Partner ID` | rich_text |
| `event_type` | `Event Type` | select |
| `source` | `Source` | select |
| `status` | `Status` | select |
| `summary` | `Summary` | rich_text |
| `metadata` | `Metadata JSON` | rich_text |
| `created_at` | `Created At` | date |

## Partner Resources map

| Resource field | Notion property | Type |
|---|---|---|
| `assignment_id` | `Assignment ID` | title |
| `partner_id` | `Partner ID` | rich_text |
| `resource_title` | `Resource Title` | rich_text |
| `resource_type` | `Resource Type` | select |
| `resource_url` | `Resource URL` | url |
| `partner_type` | `Partner Type` | select |
| `onboarding_path` | `Onboarding Path` | select |
| `priority` | `Priority` | number |
| `status` | `Status` | select |
| `reason` | `Reason` | rich_text |
| `created_at` | `Created At` | date |
| `updated_at` | `Updated At` | date |

## Tracking Links map

| Tracking field | Notion property | Type |
|---|---|---|
| `tracking_link_id` | `Tracking Link ID` | title |
| `partner_id` | `Partner ID` | rich_text |
| `destination_url` | `Destination URL` | url |
| `tracking_url` | `Tracking URL` | url |
| `source` | `Source` | rich_text |
| `campaign` | `Campaign` | rich_text |
| `medium` | `Medium` | rich_text |
| `utm_source` | `UTM Source` | rich_text |
| `utm_medium` | `UTM Medium` | rich_text |
| `utm_campaign` | `UTM Campaign` | rich_text |
| `status` | `Status` | select |
| `created_at` | `Created At` | date |
| `updated_at` | `Updated At` | date |

## Data hygiene rules

- Do not store raw Tally payloads in partner-facing fields.
- Do not store SSNs, full tax IDs, bank credentials, account numbers, private documents, or underwriting decisions.
- Use `Metadata JSON` only for compact operational metadata that is safe to retain.
- Keep reviewer notes and risk reasoning out of partner-facing dashboard payloads.
- Do not expose Notion page IDs to the browser unless a later server-side access pattern explicitly requires it.