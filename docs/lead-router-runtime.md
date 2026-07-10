# Partner-Attributed Lead Router Runtime

## Endpoint

`POST /api/lead-router`

This endpoint accepts downstream funding-readiness leads only. Partner signup remains isolated on:

- `POST /api/router`
- `POST /api/partner-signup`

## Authentication

Use either:

- `Authorization: Bearer <PARTNER_COMMAND_API_KEY>`
- `X-API-Key: <PARTNER_COMMAND_API_KEY>`

Never expose this key in browser JavaScript or an embedded widget.

## Accepted contract

The runtime accepts the approved `partner-attributed-lead` envelope from Prompt 4A:

- `schema_version = 1.0.0`
- stable `idempotency_key`
- approved `source_system`
- `submitted_at`
- complete canonical `lead`
- optional first/latest-touch context

The endpoint validates required applicant, readiness, consent, source, review, and attribution fields. It does not calculate a replacement readiness score.

## Attribution

- `partner_id` is validated against `NOTION_PARTNERS_DB_ID` when present.
- `tracking_link_id` is resolved against Tracking Links `Referral Token`.
- A tracking link must be active and related to the validated partner.
- `campaign_id`, `widget_id`, `source_url`, and UTM values are persisted with the Funding Lead.
- Null partner and tracking-link values are treated as direct traffic.

## Sensitive-data boundary

The runtime rejects payload keys or values that appear to contain:

- SSNs or full tax IDs
- bank routing/account numbers or bank-login credentials
- passwords or passcodes
- driver-license or passport values
- uploaded document content or base64 document data

Document checklist labels are allowed. Document files and document contents are not.

## Funding Leads persistence

The confirmed Notion Funding Leads database is used as the operational projection.

The adapter:

1. Looks up `External Lead ID = lead.lead_id`.
2. Rejects applicant identity conflicts with HTTP `409`.
3. Replays the existing record when the stored idempotency key matches.
4. Updates the existing page for a valid changed payload.
5. Creates a page when no record exists.
6. Stores only a redacted API audit envelope, not the raw applicant payload.

Set `LEAD_ROUTER_STORAGE_MODE=prepare` only for a deliberate non-writing validation environment. Production should use the default Notion mode.

## Partner Event behavior

After the Funding Lead write succeeds, the runtime creates a safe Partner Event using the existing schema:

- `Event Name`: `Lead Received: {lead_id}`
- `Event Type`: existing `Status Updated` or `Manual Review Requested`
- partner relation when validated
- safe status and next action
- redacted metadata only
- empty `Payload / Raw Data`

A Partner Event failure does not destroy an already-created Funding Lead. The response includes `partner_event_write_failed` so the event can be repaired.

## Environment variables

Required for live routing:

```env
PARTNER_COMMAND_API_KEY=
NOTION_API_KEY=
NOTION_PARTNERS_DB_ID=2484bc1bd63c80a79c3ac809b4308c65
NOTION_TRACKING_LINKS_DB_ID=711009b7e9fd4182af423c756950b676
NOTION_FUNDING_LEADS_DB_ID=62e717f6e61941d499bcf81a41daacfe
NOTION_PARTNER_EVENTS_DB_ID=2ea21bb9f3f4430f952b6d3d002874de
```

The existing shared Notion client also expects these variables in the current repository runtime:

```env
NOTION_PARTNER_RESOURCES_DB_ID=1f6b5150c60845e1905c2dc7cc0d1d46
```

Optional:

```env
LEAD_ROUTER_STORAGE_MODE=notion
```

## Success response

The response excludes applicant name, email, phone, exact credit score, raw answers, provider matches, internal notes, and Notion URLs.

It returns:

- lead ID
- review status and priority
- validated attribution IDs
- public-safe funding-family route
- persistence results
- warnings
- request and idempotency metadata

## Error responses

- `400 invalid_json`
- `400 schema_validation_error`
- `400 restricted_data_detected`
- `401 unauthorized`
- `405 method_not_allowed`
- `409 idempotency_key_mismatch`
- `409 lead_conflict`
- `422 partner_not_found`
- `422 tracking_link_not_found`
- `422 tracking_link_inactive`
- `422 tracking_link_partner_mismatch`
- `503 funding_leads_not_configured`
- `503 tracking_links_not_configured`
- `500/502` Notion or runtime failures

## Remaining dependencies / TODO

- Add a stable text `Tracking Link Key` and migrate external attribution away from Notion's numeric unique ID.
- Add dedicated Partner Event options such as `Lead Received`, `Lead Routed`, and `Lead Duplicate Replayed`; the minimum runtime currently uses existing safe options.
- Configure `NOTION_FUNDING_LEADS_DB_ID` in Vercel production and preview environments before live testing.
- Add a durable Google Sheets backup adapter in the later persistence sprint. It is intentionally not mocked into this runtime.
- Test with a real active partner and real Tracking Links `Referral Token` during a controlled deployment window.
