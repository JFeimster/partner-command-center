# CRM Operational Ledgers v1 — Non-production contracts

Status: header-only staging worksheets are installed, with no events recorded and no automatic sends or submissions enabled.
Workbook: https://docs.google.com/spreadsheets/d/1Bc8Im3uD1_5qAvS-VYBoXdWjFAX5wWecTKP3Hw44PJo/edit
Provider Submissions (Staging) sheetId 1243516518, 20 headers A:T. Outreach Events (Staging) sheetId 2089201346, 17 headers A:Q.

## Source boundary / reference registries
- Master Applicants is the case-system of record. Preserve its original 46 A:AT headers, row identifiers, old tab IDs and Sheets adapter in lib/google-sheets-sync.js.
- Notion Funding Partners data source: collection://1c54bc1b-d63c-801f-946c-000bd9dd59b5 (58 entries incl. variants; 40 are tagged Affiliate Status=Active). A partner's affiliate status is NOT evidence of an integrated lender submission endpoint.
- Notion Funding Products data source: collection://a59bc438-509e-4ab9-887f-24f12781f2ea (59 product records). Link stable Notion page IDs/urls and existing product/provider IDs rather than guessing matching IDs from names.
- Provider submissions refer to actual receiving funding provider, not necessarily applicant source_provider, which currently mixes route/intake categories.
- The provider and product inventories are read-only references, not approved automated submission destinations. Specific submission capabilities remain unverified.

## Provider Submissions (Staging) A:T
`event_id, submission_id, record_id, provider_id, product_id, notion_provider_page_id, notion_product_page_id, event_type, status, occurred_at, source_event_id, idempotency_key, external_submission_id, offer_id, offer_amount, funded_amount, currency, source_system, ingested_at, internal_reference`

- The ledger is append-only: one row per observed provider event. One record_id can have many submission_id values, one submission_id can have multiple events, and all events within that submission must agree on record_id/provider_id/product_id.
- `event_id` uniquely identifies an event; `idempotency_key` uniquely identifies a source fact and dedupes retries. Same key + different canonical payload is an error, not an overwrite.
- Allowed status: submitted, under_review, offered, funded, declined, withdrawn. Lifecycle cannot regress from terminal outcomes. `status_changed` is allowed event_type with explicit new status.
- An offer requires amount and provider-backed offer evidence; `funded` requires documented funding evidence and positive funded_amount. No lender conversion or dollar KPI is inferred from a generic status on Master Applicants.
- Mandatory foreign key: verify record_id in Master Applicants before accepting a new event; unknown, blank or duplicate case identities must go to Exceptions.

## Outreach Events (Staging) A:Q
`event_id, record_id, channel, direction, status, template_id, workflow_id, scheduled_at, occurred_at, external_message_id, source_event_id, idempotency_key, source_system, attempt_number, consent_basis, suppression_reason, ingested_at`

- Append-only history; one row per observed outbound or inbound event, not a single message_sent flag. Channel: email, sms, phone, other; direction: inbound/outbound.
- Status: queued, attempted, sent, delivered, failed, replied, canceled, suppressed. Sent/delivered/replied require a provider message ID + event timestamp; replied must be inbound.
- Suppressed events must include suppression_reason. Never send based only on a stage change. Consent, opt-outs, do-not-contact and reply stop rules must be checked against dedicated workflow state before anything is scheduled.
- No addresses, phone numbers, message bodies, credit details, applicant names, bank credentials, or documents in these event sheets.

## Placement and future architecture
- `Master Applicants!A:AT`: current case state and existing integration contract only; do not add another 100 columns.
- Provider Submissions (Staging): immutable provider activity evidence and offer/funding provenance; separate current-submission state is a derivative keyed by submission_id.
- Outreach Events (Staging): communication evidence; next-message status belongs in future Applicant Workflow State and durable queue, not Master Applicant calculated columns.
- Notion funding partner/product registries: canonical reference identities, normalized alias mapping, disabled/retired routing rules; no one tab per provider.
- Dashboard V2: only promote measured, reconciled summaries after real events land. Until then display Not tracked, not zero.

## Staging acceptance and activation gates
1. Verify both tab IDs and exact header sequence through Sheets API; confirm row 2 onwards empty, no accidental send/submit integrations.
2. Offline synthetic tests: one case/two providers, multiple case events, duplicate event replay, conflicting idempotency, provider/product mismatch, offer/funding evidence, consent suppression, inbound reply.
3. Implement a service-account writer with append-only transactional idempotency backed by a durable unique index or locked CAS; Sheets alone does not provide a trustworthy concurrent uniqueness guarantee.
4. Source-data migration requires identity resolution and explicit mapping of verified historical submission records; do not synthesize event rows from Master source_provider/status alone.
5. Before activating inbound/outbound integrations, enforce least privilege and suppression and review actual provider submissions/verification proofs.

Related tasks: CRM-19, CRM-20, CRM-21, CRM-23, CRM-24, CRM-27. CRM-01 security remediation was verified complete on 2026-10-19.
