# Notion Lead Field Map

## Purpose

Define the Notion projection for `POST /api/lead-router` without mixing funding leads into partner-signup records.

## Existing databases inspected

### Moonshine Capital Partners CRM

Authoritative partner identity source.

Relevant properties:

- `Name`
- `Partner ID`
- `Email`
- `Company`
- `Partner Type`
- `Status`
- `Tier`
- `Onboarding Path`
- `Consent to Contact`

Router use:

- resolve exact `Partner ID`
- read the authoritative page ID
- confirm partner status
- create a relation from the Funding Leads record
- never create a partner through `/api/lead-router`

### Tracking Links

Authoritative partner-link and campaign source.

Relevant properties:

- `Tracking Link ID` — current auto-increment identifier
- `Referral Token` — preferred external stable lookup token
- `Partner` — relation to Partners CRM
- `Partner Code`
- `Status`
- `Campaign Name`
- `Tracking URL`
- `Destination URL`
- `Destination Type`
- `Link Type`
- `UTM Source`
- `UTM Medium`
- `UTM Campaign`
- `UTM Term`
- `UTM Content`
- `Clicks`
- `Conversions`

Router use:

- resolve `tracking_link_id` by `Referral Token` first
- allow serialized numeric `Tracking Link ID` during migration
- require `Status = Active`
- derive the Partner from the relation
- reject partner/link mismatches
- use link campaign and UTM data as authoritative defaults

Recommended schema improvement:

```text
Add a unique text property named Tracking Link Key.
```

After migration, `tracking_link_id` should resolve against `Tracking Link Key`, not the Notion auto-increment value.

### Partner Events

Append-only audit and dashboard event source.

Relevant properties:

- `Event Name`
- `Event Type`
- `Partner`
- `Partner ID`
- `Source`
- `Status`
- `Summary`
- `Event Summary`
- `Metadata JSON`
- `Occurred At`
- `Actor`
- `Next Action`
- `Payload / Raw Data`

Router use:

- create safe lifecycle events
- relate events to the validated Partner when available
- store `lead_id` and canonical event type in safe metadata
- never use Partner Events as the lead system of record
- leave `Payload / Raw Data` empty for live lead submissions unless a redacted audit policy explicitly allows it

Recommended Event Type additions:

- `Lead Received`
- `Lead Duplicate Replayed`
- `Lead Suspected Duplicate`
- `Lead Attribution Validated`
- `Lead Attribution Rejected`
- `Lead Routed`
- `Lead Status Updated`
- `Lead Persistence Partial`

`Manual Review Requested` already exists and should be reused.

### Partner Resources

Partner enablement and resource catalog only.

Router use:

- optionally select approved partner enablement resources
- optionally attach resource IDs to a partner-facing next action
- do not write applicant or funding-lead records here
- do not store lead PII in resource assignments

## Required new database

Create a dedicated database:

```text
Funding Leads
```

Recommended environment variable:

```text
NOTION_FUNDING_LEADS_DB_ID
```

The database is the operational Notion projection. A more secure CRM or database may remain the long-term system of record.

## Funding Leads property map

| Notion property | Type | Canonical source | Required | Visibility |
|---|---|---|---:|---|
| `Lead Name` | Title | business name + lead ID | Yes | Operator |
| `Lead ID` | Text | `lead.lead_id` | Yes | Partner-safe ID |
| `Schema Version` | Text | `schema_version` | Yes | Operator |
| `Source System` | Select | `source_system` | Yes | Analytics |
| `Source Event ID` | Text | `source_event_id` | No | Operator |
| `Idempotency Key` | Text | `idempotency_key` | Yes | Operator |
| `Payload Hash` | Text | server-calculated SHA-256 | Yes | Operator |
| `Dedupe Status` | Select | server result | Yes | Operator |
| `First Name` | Text | `lead.applicant.first_name` | Yes | Operator |
| `Last Name` | Text | `lead.applicant.last_name` | Yes | Operator |
| `Business Name` | Text | `lead.applicant.business_name` | Yes | Partner-safe by policy |
| `Email` | Email | `lead.applicant.email` | Yes | Operator only |
| `Phone` | Phone | `lead.applicant.phone` | Yes | Operator only |
| `State` | Text | `lead.applicant.state` | Yes | Partner-safe |
| `Monthly Revenue` | Number | `lead.answers.monthly_revenue` | Yes | Operator only |
| `Time in Business Months` | Number | `lead.answers.time_in_business_months` | Yes | Operator |
| `Credit Score Band` | Text | server-derived from `credit_score` | Yes | Operator only |
| `Bank Status` | Select | `lead.answers.bank_status` | Yes | Operator only |
| `Business Structure` | Select | `lead.answers.business_structure` | Yes | Operator |
| `Funding Purpose` | Select | `lead.answers.funding_purpose` | Yes | Partner-safe label |
| `Desired Funding Amount` | Number | `lead.answers.desired_funding_amount` | Yes | Operator |
| `Desired Amount Band` | Text | server-derived | Yes | Partner-safe |
| `Readiness Score` | Number | `lead.score_result.score` | Yes | Public-safe |
| `Readiness Tier` | Select | `lead.score_result.tier.id` | Yes | Public-safe |
| `Score Engine Version` | Text | `lead.score_result.engine_version` | Yes | Operator |
| `Lead Priority` | Select | `lead.lead_priority` | Yes | Operator |
| `Primary Funding Family` | Text | `lead.primary_funding_family.id` | Yes | Public-safe |
| `Secondary Funding Families JSON` | Text | IDs only | Yes | Operator |
| `Strengths JSON` | Text | `lead.strengths` | Yes | Public-safe content |
| `Risks JSON` | Text | `lead.risks` | Yes | Public-safe content |
| `Recommended Documents JSON` | Text | labels and IDs only | Yes | Public-safe content |
| `Next Steps JSON` | Text | `lead.next_steps` | Yes | Partner-safe projection |
| `Manual Review Recommended` | Checkbox | `lead.manual_review_recommended` | Yes | Partner-safe |
| `Review Status` | Select | `lead.review_status` | Yes | Partner-safe |
| `Next Action` | Text | server-calculated | Yes | Partner-safe |
| `Partner` | Relation | validated Partners page | No | Operator |
| `Partner ID` | Text | validated `lead.partner_id` | No | Partner-safe |
| `Attribution Status` | Select | server validation result | Yes | Operator |
| `Tracking Link` | Relation | validated Tracking Links page | No | Operator |
| `Tracking Link ID` | Text | validated external key | No | Partner-safe |
| `Campaign ID` | Text | canonical campaign | No | Analytics |
| `Widget ID` | Text | `lead.widget_id` | No | Analytics |
| `Source Asset` | Text | `lead.source_asset` | Yes | Analytics |
| `Source URL` | URL | `lead.source_url` | Yes | Operator |
| `UTM Source` | Text | canonical UTM | No | Analytics |
| `UTM Medium` | Text | canonical UTM | No | Analytics |
| `UTM Campaign` | Text | canonical UTM | No | Analytics |
| `UTM Term` | Text | canonical UTM | No | Analytics |
| `UTM Content` | Text | canonical UTM | No | Analytics |
| `Consent Captured At` | Date | `lead.consent.captured_at` | Yes | Compliance |
| `Consent Method` | Select | `lead.consent.method` | Yes | Compliance |
| `Consent Text Version` | Text | `lead.consent.text_version` | Yes | Compliance |
| `Created At` | Date | `lead.created_at` | Yes | Partner-safe |
| `Updated At` | Date | `lead.updated_at` | Yes | Partner-safe |
| `Last Router Request ID` | Text | server request ID | Yes | Operator |
| `Persistence Status` | Select | server result | Yes | Operator |
| `Operator Notes` | Text | internal only | No | Operator only |

## Notion write rules

### Create

Create a Funding Leads page when no page exists for `Lead ID`.

### Update

Update the existing page when:

- `Lead ID` matches
- payload is not an exact replay
- `updated_at` is newer
- immutable applicant identity does not conflict
- the update passes schema and consent validation

### Replay

Do not create or update a page for an exact idempotent replay unless a failed backup/event write needs retry.

### Conflict

Do not overwrite a page when the same `Lead ID` or idempotency key maps to a materially different applicant or source event. Return `409 lead_conflict`.

### Relations

- Set `Partner` only after successful partner validation.
- Set `Tracking Link` only after successful link validation.
- Clear neither relation based solely on a missing value in a retry.
- A rejected attribution attempt belongs in event metadata, not in the relation field.

## Partner Events field map

| Partner Events property | Value |
|---|---|
| `Event Name` | `{event_type}: {lead_id}` |
| `Event Type` | human-readable canonical option |
| `Partner` | validated Partner relation or empty |
| `Partner ID` | validated partner ID or empty |
| `Source` | `API`, `Website`, `gpt_action`, or compatible source |
| `Status` | safe review or persistence status |
| `Summary` | non-PII operational sentence |
| `Event Summary` | optional expanded safe sentence |
| `Metadata JSON` | redacted event envelope |
| `Occurred At` | event timestamp |
| `Actor` | source system, partner, operator, or system |
| `Next Action` | safe next action |
| `Payload / Raw Data` | leave empty for live lead submissions |

Minimum `Metadata JSON`:

```json
{
  "event_type": "lead.routing.completed",
  "lead_id": "lead_...",
  "partner_id": "MS-P-...",
  "tracking_link_id": "ref_...",
  "campaign_id": "campaign-slug",
  "widget_id": "widget-slug",
  "source_system": "embed_widget",
  "review_status": "queued_for_review",
  "request_id": "req_...",
  "correlation_id": "corr_..."
}
```

## Google Sheets projection

Use existing tabs:

### Leads

Recommended columns:

```text
Lead ID
Schema Version
Source System
Source Event ID
Idempotency Key
Dedupe Status
Business Name
Contact Name
Email
Phone
State
Monthly Revenue
Time in Business Months
Credit Score Band
Funding Purpose
Desired Funding Amount
Desired Amount Band
Readiness Score
Readiness Tier
Lead Priority
Primary Funding Family
Manual Review Recommended
Review Status
Partner ID
Attribution Status
Tracking Link ID
Campaign ID
Widget ID
Source Asset
Source URL
UTM Source
UTM Medium
UTM Campaign
Consent Captured At
Consent Method
Consent Text Version
Created At
Updated At
Next Action
Persistence Status
```

Upsert by `Lead ID`.

### Lead Activity

Recommended columns:

```text
Event ID
Event Type
Lead ID
Partner ID
Tracking Link ID
Source System
Actor
Review Status
Summary
Next Action
Request ID
Correlation ID
Created At
```

Append once per unique `Event ID`.

## Excluded data

Do not write these fields to Notion or Google Sheets:

- SSN
- full EIN or tax ID
- bank routing or account numbers
- online banking credentials
- passwords, passcodes, API keys, or webhook secrets
- uploaded document bytes or document contents
- provider identities or provider-match IDs
- private apply URLs
- commissions, payouts, or economics
- raw fraud signals
- raw IP addresses
- complete unredacted payloads
- internal underwriting-style notes

Provider-match IDs and internal notes may remain in a separate protected store. They must not be copied into Partner Events, Sheets, or partner dashboards.

## Migration notes

1. Keep the existing `lead-submission.schema.json` and flat route adapter temporarily.
2. Add the new Funding Leads database.
3. Add the recommended Partner Events options.
4. Add a unique text `Tracking Link Key`.
5. Implement canonical validation and attribution resolution.
6. Backfill no PII beyond what is needed for current operations.
7. Switch GPT Actions and trusted adapters to the canonical OpenAPI contract.
8. Retire the legacy flat payload only after production traffic is verified.
