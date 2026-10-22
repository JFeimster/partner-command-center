# Wix contact mirror — partner and funding events

## Source ownership

- **Partner Command Center / platform-core Supabase** owns `partners.status`, `partners.partner_type`, organization membership and approved application evidence. Operator updates are server-side, validated and logged as `partner.classification.updated` in `public.activity_logs`.
- **BrokerFlow AI** owns `brokerflow_deals.pipeline_stage` and review status independently. These values must not be written into Wix Partner Status.
- **Wix Contacts** is a downstream contact, audience, consent and communications mirror — not a workflow or credit-decision authority.
- **Wix Forms**: retain enabled `Become a Partner` (Wix form ID `db7be176-5841-4c1b-b740-8343eae4465b`; public `https://jasonfeimster.wixforms.com/f/7451037452602443026`). Do Less Earn More, Automation Pack n8n and Limited Power of Attorney were disabled and kept for historic record preservation.

## Exact current Wix field keys

| Semantic value | Wix Contacts extended field |
| --- | --- |
| Partner Status | `custom.partner-status-aqgsprsuyxigeupsffng` |
| Lead Status | `custom.lead-status-eyvsodtqmzhliowvkrkwhlu` |
| Funding Stage | `custom.funding-stage-kevpmtfjtluxpcpnhgtzb` |
| Contact Type | `custom.contact-type-fthrfdxphfogegdztkapds` |
| Lead Source | `custom.lead-source-zcrhbqpohwzdpupzmoogcip` |
| External CRM ID | `custom.external-crm-id-ynriagpsvpziodgatkb` |

Wix Contacts extended-field definitions currently support text, number, date and URL, not native enum. UI selects belong in the authoritative application; **only canonical enum strings** may be mirrored to the corresponding Wix text fields. Do not make duplicate Wix fields to simulate options. `Partner Type` does not yet have a native Wix mirror field; create it only when the actual event delivery pipeline is configured, or use a classification label without asserting source-of-truth state.

## Controlled partner values

- Partner operational status: `pending | active | paused | terminated` (existing database CHECK).
- Partner type: `funding_broker | referral_partner | affiliate_partner | center_of_influence | professional_service_provider | community_connector | internal_operator | unknown`.
- Partner application review status remains separate: `new | needs_review | qualified | onboarding | approved | declined | nurture`.
- BrokerFlow deal pipeline remains separate: `intake_captured | review_requested | documents_pending` (existing CHECK at time of adoption).

## Event delivery contract

1. On a **real** `partner.classification.updated` audit event, a server-side, authenticated integration worker selects the canonical partner record scoped to the event organization.
2. Ignore `partners.metadata.fictional = true`; do not mirror QA/test records or run a bulk sync across all partners.
3. Resolve Wix by an existing explicit partner/contact identity mapping, or an unambiguous, verified exact email match. Never create a new Wix contact solely from a status event. Quarantine multiple matches for human review.
4. Send a single PATCH to the matched Wix contact, with its latest revision and only the approved mirrored fields. Do not change the contact's emails, marketing subscription status, consent, unrelated extended fields or group labels.
5. Use `organization_id:event_id:contact_id:field_version` for idempotency; log attempted delivery and result without raw personal data. Retry transient failures with bounded backoff; do not mark synchronized on HTTP failure or empty response.
6. Record `source = partner_command`, `source_record_id`, `event_id`, `occurred_at`, `previous_status` and `status`. No invented approval, enrollment or opt-in events.
7. Independently mirror BrokerFlow's **verified** deal-stage events only into Funding Stage, using the original borrower-contact association; never apply deal stage to the referrer.
8. Wix dynamic saved segments depend on the Wix builder; no supported native segment creation API was established. Suggested segments: Partner Applicants Pending, Approved Not Activated, Active Partners, Paused Partners, Broker Prospects, Referral Partners, Funding Intake, Funding In Review, Funding Documents Pending, and opted-in Partner Nurture. Apply the Wix subscription and deliverability conditions before using any segment for marketing.

## Security and deployment gates

- Never place Wix API keys/service-role credentials in `NEXT_PUBLIC_` env vars or client JavaScript.
- Limit access to operator/server-side service credentials. Preserve organization checks on every partner event.
- Use an authenticated outbox job; do not call Wix directly from the `SECURITY DEFINER` SQL RPC.
- Do not equate a Wix form submission with approval, portal activation, marketing consent or a funding decision.
- Production delivery remains **off** until the Wix secret and identity mapping are configured and a real partner event has passed an idempotent E2E test.
- The three retired form workflows are inactive. The retained **MC | Become a Partner Application Review** automation creates an internal review task and applies existing `SOURCE · Partner Application` label.
