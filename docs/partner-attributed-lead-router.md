# Partner-Attributed Lead Router Contract

## Status

Canonical downstream contract for partner-attributed funding-readiness leads handled by Partner Command Center.

Owner route:

```text
POST /api/lead-router
```

Owner repository:

```text
JFeimster/partner-command-center
```

Canonical score owner:

```text
JFeimster/am-i-fundable
```

This contract routes funding-readiness leads. It does not create partners, approve funding, submit to lenders, quote terms, or expose provider-specific matches.

## Route separation

| Route | Purpose | Allowed entity |
|---|---|---|
| `POST /api/router` | Partner intake orchestration and partner lifecycle actions | Partner applicant |
| `POST /api/partner-signup` | Direct or GPT-assisted partner signup | Partner applicant |
| `POST /api/lead-router` | Funding-readiness lead ingestion, attribution, deduplication, persistence, and safe event creation | Business funding lead |

A borrower or business funding lead must never be sent to `/api/router` or `/api/partner-signup`. A partner signup must never be sent to `/api/lead-router`.

## Source systems

The router accepts trusted server-to-server submissions from:

- Am I Fundable
- FundStack AI adapters
- vertical funnel adapters
- Embed Widgets adapters
- partner landing-page adapters
- GPT Actions using stored authentication
- approved operator tools
- the legacy Partner Command Center dashboard adapter during migration

Browser code must not contain `PARTNER_COMMAND_API_KEY`, Notion credentials, Google service-account credentials, or any other trusted secret.

## Canonical request

The request schema is:

```text
schemas/partner-attributed-lead.schema.json
```

The request envelope contains:

```json
{
  "schema_version": "1.0.0",
  "idempotency_key": "lead_...:create",
  "source_system": "embed_widget",
  "source_event_id": "optional-source-event-id",
  "submitted_at": "2026-07-10T16:45:00Z",
  "lead": {},
  "submission_context": {}
}
```

The embedded `lead` mirrors the canonical Am I Fundable funding-readiness object. Am I Fundable remains the score and public-readiness owner. Partner Command Center validates attribution, deduplicates the lead, persists the operational projection, records events, and prepares dashboard-safe updates.

## Required fields

### Request envelope

| Field | Required | Rule |
|---|---:|---|
| `schema_version` | Yes | Must equal `1.0.0`. |
| `idempotency_key` | Yes | Stable retry key, 8–200 safe characters. |
| `source_system` | Yes | Must match the source-system enum. |
| `source_event_id` | No | Immutable source submission ID when available. |
| `submitted_at` | Yes | ISO 8601 date-time. |
| `lead` | Yes | Canonical funding-readiness lead. |
| `submission_context` | No | Server-safe adapter and attribution-touch metadata. |

### Lead identity and contact

Required:

- `lead_id`
- `applicant.first_name`
- `applicant.last_name`
- `applicant.business_name`
- `applicant.email`
- `applicant.phone`
- `applicant.state`
- `created_at`
- `updated_at`

### Readiness and routing

Required:

- `answers`
- `score_result`
- `lead_priority`
- `primary_funding_family`
- `secondary_funding_families`
- `risks`
- `strengths`
- `recommended_documents`
- `next_steps`
- `manual_review_recommended`
- `review_status`

The router must not trust a client-supplied score by itself. For Am I Fundable submissions, verify the engine version and payload signature or recompute from normalized answers. For other adapters, invoke the canonical scoring adapter or route the lead to manual review without inventing a score.

### Attribution

The following fields are required in the canonical object but may be `null`:

- `partner_id`
- `tracking_link_id`
- `campaign_id`
- `widget_id`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

The following are always required:

- `source_url`
- `source_asset`

Direct traffic is valid. Do not create fake partner IDs such as `ORGANIC`.

### Consent

Required:

- `consent.contact = true`
- `consent.privacy = true`
- `consent.captured_at`
- `consent.method`
- `consent.text_version`

A request without affirmative, versioned consent must not create a live operational lead.

## Optional fields

Optional fields include:

- `source_event_id`
- `submission_context.request_id`
- `submission_context.adapter_version`
- `submission_context.legacy_payload`
- `submission_context.first_touch`
- `submission_context.latest_touch`
- `lead.internal_context`

`lead.internal_context` is server-side only. It may contain attribution audit hints, persistence IDs, payload hash, dedupe status, provider-match IDs, and internal notes. It must never be returned to a browser, public GPT, applicant, or partner dashboard.

## Partner ID validation

When `partner_id` is present:

1. Validate the format.
2. Query the Partners database by exact `Partner ID`.
3. Confirm the record exists.
4. Read the authoritative Notion page ID and status.
5. Credit the partner only when the partner is active and permitted to receive attributed leads.
6. Treat a new or review-pending partner as `pending_partner_activation`.
7. Treat paused, archived, rejected, or missing partners as uncredited.
8. Never accept the partner name, email, company, or URL query value as proof of identity.

Default acquisition behavior is to preserve the lead while removing unvalidated attribution. The response must include a warning and set attribution status to `rejected`, `unresolved`, or `pending_partner_activation`.

Trusted partner-only channels may enforce strict mode and return `422` instead of accepting the lead unattributed.

## Tracking Link ID validation

The current Tracking Links database exposes:

- an auto-increment `Tracking Link ID`
- `Referral Token`
- `Partner` relation
- `Partner Code`
- `Status`
- `Campaign Name`
- UTM fields
- destination and link-type fields

Resolution order:

1. Match `tracking_link_id` to `Referral Token`.
2. During migration, allow a serialized numeric `Tracking Link ID`.
3. Require `Status = Active`.
4. Require the `Partner` relation to resolve to one Partners CRM record.
5. Derive the canonical `partner_id` from the related Partner record.
6. When both IDs were supplied, require the derived partner to match `partner_id`.
7. Use the Tracking Links record as the authority for campaign and UTM defaults.
8. Retain inbound values as observed touch metadata, not proof of partner ownership.

A partner/link mismatch must never credit either party. Log a safe attribution-rejection event.

## Campaign attribution

`campaign_id` is an operational slug, not a secret.

Precedence:

1. Tracking Links `Campaign Name`
2. Tracking Links `UTM Campaign`
3. validated inbound `campaign_id`
4. inbound `utm_campaign`
5. `null`

Campaign values must be normalized, length-limited, and free of scripts, credentials, and private URLs. Campaign attribution may remain present even when no partner resolves.

## Widget attribution

`widget_id` identifies the deployed surface or preset.

Validation:

- require the safe ID pattern
- compare to a server-side widget registry or approved configuration when available
- preserve unknown but well-formed IDs as `unverified_widget`
- never use widget identity as proof of partner ownership
- keep legacy `ref` only as an unvalidated alias for `partner_id`
- never accept a browser-supplied API key

Embed Widgets must become an adapter. Its local `affiliateId`, Supabase insert, generic webhook, and independent scoring behavior are not canonical.

## Lead deduplication

### Hard idempotency

Use these keys in order:

1. `idempotency_key`
2. `source_system + source_event_id`
3. `lead_id`

Rules:

- Same key and same normalized payload hash: return the original receipt with `result = duplicate_replayed`.
- Same key and different material payload: return `409 lead_conflict`.
- Same `lead_id` with a newer valid `updated_at`: update the existing operational record and return `result = updated`.
- Same `lead_id` with immutable identity changes or an older timestamp: return `409 lead_conflict`.

### Soft duplicate review

Calculate a suspected-duplicate fingerprint from normalized:

- applicant email
- phone digits
- business name
- desired funding amount
- funding purpose
- recent time window

A soft match must not silently merge people or businesses. Create or update the lead with:

```text
dedupe_status = suspected_duplicate
manual_review_recommended = true
review_status = queued_for_review
```

Create a dashboard-safe duplicate-review event.

## Lead event creation

Every accepted request creates an append-only event envelope containing:

- `event_id`
- `event_type`
- `lead_id`
- validated `partner_id` or `null`
- validated `tracking_link_id` or `null`
- `source_system`
- `actor`
- `occurred_at`
- `review_status`
- safe `summary`
- `next_action`
- safe metadata
- `request_id`
- `idempotency_key`
- `payload_hash`

Canonical event types:

- `lead.received`
- `lead.duplicate_replayed`
- `lead.suspected_duplicate`
- `lead.attribution.validated`
- `lead.attribution.rejected`
- `lead.routing.completed`
- `lead.manual_review.requested`
- `lead.persistence.partial`
- `lead.status.updated`

The Partner Events database should add human-readable select options for these events. Until then, the stable dot-notation value belongs in `Metadata JSON` and `Event Name`, with a compatible existing select value used only as a display fallback.

Do not place raw answers, exact credit data, full payloads, documents, secrets, provider matches, or internal notes in partner-visible event metadata.

## Notion write behavior

The existing Partners, Partner Events, Partner Resources, and Tracking Links databases are supporting sources. They are not a lead system of record.

Create a dedicated Funding Leads database or equivalent secure lead store and configure:

```text
NOTION_FUNDING_LEADS_DB_ID
```

Write sequence:

1. Resolve or reject partner attribution.
2. Resolve or reject tracking-link attribution.
3. Run hard and soft dedupe checks.
4. Upsert the Funding Leads record by `Lead ID`.
5. Add validated Partner and Tracking Link relations.
6. Create append-only Partner Events.
7. Queue Google Sheets backup.
8. Queue dashboard sync.
9. Return the safe receipt.

Notion writes must be idempotent. Replayed requests must not create duplicate lead pages or duplicate lifecycle events.

Partner Resources may inform document checklists, partner enablement, or next-step recommendations. Do not write lead records into Partner Resources.

See:

```text
docs/notion-lead-field-map.md
```

## Google Sheets backup behavior

Use the existing workbook pattern:

- `Leads` — one row per `lead_id`
- `Lead Activity` — append-only event rows

Rules:

- upsert `Leads` by `Lead ID`
- deduplicate event rows by `Event ID`
- flatten arrays as stable JSON strings or pipe-delimited IDs
- store only the operational projection
- do not store uploaded documents, bank statements, SSNs, tax IDs, credentials, raw internal notes, provider economics, private apply links, or full provider-match output
- Sheets is a backup/reporting layer, not the source of truth

Failure policy:

- Primary lead store succeeds, Sheets fails: return success with a warning and queue retry.
- Primary lead store fails, durable queue succeeds: return accepted/queued status.
- Primary lead store and durable queue both fail: return `502 persistence_unavailable`.
- Event write failure after primary lead write: return success with `persistence.partner_event = partial`, log internally, and retry.

## Response payload

Successful responses use the existing Partner Command Center envelope:

```json
{
  "ok": true,
  "data": {
    "action": "submitPartnerAttributedLead",
    "result": "created",
    "lead_id": "lead_...",
    "review_status": "queued_for_review",
    "lead_priority": "hot",
    "manual_review_recommended": false,
    "attribution": {
      "status": "validated",
      "partner_id": "MS-P-...",
      "tracking_link_id": "ref_...",
      "campaign_id": "campaign-slug",
      "widget_id": "widget-slug"
    },
    "routing": {
      "primary_funding_family": "working_capital",
      "secondary_funding_family_ids": ["business_line_of_credit"],
      "next_action": "Send the preparation checklist and queue human review."
    },
    "persistence": {
      "primary_store": "created",
      "partner_event": "created",
      "google_sheets": "written"
    },
    "dashboard_visibility": "partner_safe",
    "warnings": []
  },
  "meta": {
    "request_id": "req_...",
    "idempotency_key": "lead_...:create",
    "schema_version": "1.0.0",
    "received_at": "2026-07-10T16:45:01Z"
  }
}
```

Do not return:

- raw assessment answers
- applicant email or phone
- exact credit score
- raw consent evidence
- Notion page URLs
- Google Sheet row numbers
- provider names or IDs
- private apply URLs
- commissions or economics
- internal notes
- authentication or environment details

## Validation errors

| HTTP | Code | Meaning |
|---:|---|---|
| 400 | `invalid_json` | Body cannot be parsed. |
| 400 | `schema_validation_error` | Required field, type, enum, or format failed. |
| 400 | `missing_consent` | Affirmative versioned consent is absent. |
| 400 | `restricted_data_detected` | Payload contains prohibited sensitive or secret content. |
| 401 | `unauthorized` | Trusted credential is missing or invalid. |
| 403 | `forbidden` | Caller cannot submit for the claimed partner or channel. |
| 409 | `lead_conflict` | Idempotency key or lead ID maps to a materially different payload. |
| 422 | `partner_not_found` | Strict channel could not resolve the partner. |
| 422 | `partner_not_active` | Strict channel partner is not active. |
| 422 | `tracking_link_not_found` | Strict channel could not resolve the link. |
| 422 | `tracking_link_inactive` | Link exists but is not active. |
| 422 | `tracking_link_partner_mismatch` | Link belongs to another partner. |
| 429 | `rate_limited` | Source exceeded its submission limit. |
| 502 | `persistence_unavailable` | Primary write and durable queue failed. |
| 500 | `server_error` | Unexpected router failure. |

Errors must include a request ID and safe field-level details. They must not include secrets, raw Notion responses, stack traces, database IDs, or complete submitted payloads.

## Privacy boundaries

### Public/applicant safe

- `lead_id`
- readiness score and tier
- generic funding-family guidance
- strengths and risks written as readiness observations
- document labels
- next steps
- manual-review recommendation
- safe review status
- disclaimer

### Partner dashboard safe

- `lead_id`
- business display name when consent and access policy allow
- state
- readiness tier
- funding-purpose label
- desired amount band, not necessarily exact amount
- review status
- safe next action
- event timestamps
- validated attribution summary

### Operator only

- applicant email and phone
- raw answers
- exact credit score
- consent evidence
- raw attribution hints
- dedupe fingerprints
- persistence IDs
- fraud/rate-limit signals
- internal notes
- provider matches and rules
- documents and document contents

### Never store in this router

- SSN
- full EIN or tax ID
- bank credentials
- routing/account numbers
- authentication secrets
- raw card data
- passwords or passcodes

## Dashboard event requirements

Every dashboard event must include:

- `event_id`
- `event_type`
- `lead_id`
- `partner_id` or `null`
- `occurred_at`
- `review_status`
- `source_system`
- `summary`
- `next_action`
- `visibility`
- `correlation_id`

Visibility values:

- `partner_safe`
- `operator_only`
- `direct_operator_queue`

Partner events must not reveal another partner's lead, unvalidated attribution, private contact details, provider routing, or internal review notes.

The dashboard must treat events as append-only. Status is read from the lead record; events explain how it changed.

## Legacy adapter

The existing flat `/api/lead-router` payload remains a temporary adapter only.

| Legacy field | Canonical destination |
|---|---|
| `partner_id` | `lead.partner_id` as an unvalidated hint |
| `business_name` | `lead.applicant.business_name` |
| `contact_name` | deterministic first/last-name adapter or manual review |
| `email` | `lead.applicant.email` |
| `phone` | `lead.applicant.phone` |
| `monthly_revenue` | `lead.answers.monthly_revenue` |
| `time_in_business` | `lead.answers.time_in_business_months` through explicit parsing |
| `funding_need` | `lead.answers.desired_funding_amount` |
| `use_of_funds` | `lead.answers.funding_purpose` through an explicit enum map |
| `source` | `lead.source_asset` |
| `created_at` | `lead.created_at` |

The adapter must not fabricate missing readiness answers, a score, consent, or attribution. Incomplete legacy submissions are queued for manual review.

## Source-specific requirements

### Am I Fundable

- sends the complete canonical lead
- remains score owner
- includes engine version
- forwards captured attribution and consent
- uses trusted server authentication

### FundStack AI

- acts as acquisition and routing layer
- sends users to Am I Fundable or uses its adapter
- preserves attribution parameters
- does not use its two-variable local score as canonical
- does not use a fake `ORGANIC` partner ID

### Vertical funnels and partner landing pages

- preserve source URL and source asset
- preserve first-touch and latest-touch hints
- never claim approval
- never expose trusted credentials

### Embed Widgets

- uses canonical parameter names
- supports `ref` only as a legacy hint
- sends through a trusted server adapter
- does not write directly to the canonical lead store from browser code
- does not use independent score logic as final readiness output

### GPT Actions

- use `integrations/openapi.partner-lead-router.json`
- store authentication in the GPT Action configuration
- send versioned consent evidence
- receive only the safe receipt
- do not receive provider matches, private URLs, or internal notes

## Acceptance criteria

- Partner signup and funding lead submission remain separate.
- One canonical request schema covers every approved lead source.
- Direct traffic works with null partner attribution.
- Partner credit occurs only after Partner and Tracking Link validation.
- Repeated submissions are idempotent.
- Soft duplicates are reviewed, not silently merged.
- A dedicated lead record is written before dashboard sync.
- Partner Events are append-only and safe.
- Google Sheets remains a backup projection.
- Public and partner responses contain no restricted internal data.
- Deployment configuration is unchanged by this contract-only change.
