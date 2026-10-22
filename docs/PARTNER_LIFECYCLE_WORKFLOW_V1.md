# Partner Lifecycle Workflow v1 — Moonshine Capital

Status: **Operational contract v1; automation gates disabled pending connector secrets, trigger catalog verification, and integration tests.**  
Primary product: Partner Command Center (Next.js, Vercel, platform-core Supabase project `loaowmappekunngjknnx`).  
Supporting systems: Tally, Wix Contacts, HubSpot, Notion Partners CRM, Google Sheets backend; BrokerFlow where a qualified referral becomes a funding case.

## 1. Principles and source of truth

- **Supabase** owns durable partner identity, organization membership, lifecycle state, workflow execution and event ledger only when the production canonical ingestion path is configured and verified. Until then, **Notion Moonshine Capital Partners CRM** remains the operational intake record; do not claim the relay or HubSpot sync is live.
- **Tally form `mOe658`** is the application source; `submissionId` identifies an application event, never a person. Canonical person key: lowercased trimmed verified email; preserve phone as supporting match, never merge solely on name.
- **Wix** owns site contacts, non-marketing operational labels, notes and consent observed on the Wix site; **HubSpot** owns contact relationship and human-operated task status; **Notion** owns existing partner application classification/approval while migration is phased.
- Use the existing partner ID as cross-system key when present; map external CRM IDs explicitly; never assume a Wix site contact is a signed-in member.
- No funding decision, promise of approval, compensation guarantee, site membership, promotional opt-in or payout is inferred from submitting an application.
- No duplicate contacts, emails, tasks, partner rows, tracking links, automation runs or events; every mutation is scoped to the organization and idempotent.
- Do not create a company from a person's name, nor a funding deal solely from a partner application.

## 2. Lifecycle state machine

Lifecycle (one mutually exclusive operational state, with distinct approval and activation dimensions):

| State | Entry criterion | Allowed next states | Required evidence |
|---|---|---|---|
| `application_received` | Valid Tally submission and identity match | `under_review`, `rejected` | form ID, submission ID, received time |
| `under_review` | Operator owns review | `approved`, `needs_information`, `rejected` | review owner, review entry time |
| `needs_information` | Missing required qualification details | `under_review`, `rejected` | missing checklist, request log |
| `approved` | Explicit recorded approval | `onboarding`, `suspended` | approving actor and timestamp |
| `onboarding` | Orientation/terms/tracking setup started | `activated`, `suspended` | checklist state; no implicit access |
| `activated` | Verified eligible referral channel, tracking and permissions | `producing`, `inactive`, `suspended` | activation timestamp and channel ID |
| `producing` | Verified partner activity/referral outcomes | `activated`, `inactive`, `suspended` | verified case/referral event |
| `inactive` | Dormancy rule met after eligible activity | `activated`, `suspended` | last real activity, rule version |
| `suspended` | Explicit compliance/operator hold | `under_review`, `rejected` | reason, actor, timestamp |
| `rejected` | Explicit final denial | `under_review` only with manual reopen | decision and reason |

Approval (`pending|approved|rejected`), access (`not_provisioned|invited|verified|disabled`), and activation (`not_started|in_progress|active|paused`) must be modeled independently to prevent a single `approved` flag from asserting account access.

Never silently rewrite an existing Notion `approved` value; preserve historical approvals and compute operational lifecycle from confirmed evidence.

## 3. Required record mapping

| Semantic field | Canonical/existing location | Mirror only when field truly exists |
|---|---|---|
| `partner_id` | Notion Partner ID / Supabase partner key | HubSpot contact note, Wix note or verified custom field |
| `submission_id` | Tally `Kp48A9k` sample / intake event | Notion Tally Submission ID, HubSpot note |
| `email_normalized` | Supabase/CRM identity | HubSpot, Wix, Notion |
| `source_form` | Tally ID `mOe658` | Notion Source Form / Tally Form ID |
| `attribution` | Original submission; source medium, detail, captured time | `social/YouTube` only if applicant supplied it |
| `partner_track` | Explicit qualified decision | Beginner / Affiliate Content may be provisional |
| `review_state` | Operator review event | Notion approval status where appropriate |
| `lifecycle_state` | Canonical event-derived | Projected CRM status, never guessed |
| `consent` | Platform- and purpose-specific timestamped evidence | Wix email subscription must not be changed by Tally permission to contact |
| `wix_contact_id`, `hubspot_contact_id`, `notion_page_id` | Cross-system identity map | Non-sensitive IDs only |
| `last_outreach_at` | Actual provider send/log event | Never populate from drafted/scheduled message |
| `tracking_id` | Actual issued tracking-link record | Never fabricate |
| `first_referral_at` | Valid received referral | Never infer from form |
| `first_deal_at` | Qualified case creation | Not the partner's onboarding deal |

Use notes for contextual biography, inconsistent qualifications and referral disclaimers rather than inventing fields.

## 4. Wix labels and segments

Retain existing keys: `custom.affiliate-prospect` and `custom.affiliate-program`. Do not misuse `[HQ] New Partner Orientation` as proof of orientation completed.

Candidate **saved segments** (configure only after the account's segment editing interface, filters and audience scope are verified):
1. Partner Applicants — Pending Review: affiliate prospect + review state pending.
2. Approved — Not Activated: approved and activation != active.
3. Onboarding In Progress: onboarding state, permission-gated.
4. Activated Partners: verified activation flag.
5. Partner Nurture — Non-marketing: internal work queue, *not* an email campaign audience.
6. Inactive / Re-engagement: dormancy criterion and specific outreach eligibility.

Wix subscription `NOT_SET` remains `NOT_SET` until Wix-origin marketing consent evidence. Segment enrollment must not trigger marketing emails automatically.

## 5. Task / workflow templates (draft; no applicant-specific tasks generated in v1)

All task actions must have `workflow_version`, `partner_id`, `task_key`, `owner`, `due_at`, `source_event_id`, `status`, `notes`, cross-system IDs. Unique logical key: `(org_id, partner_id, workflow_version, task_key, milestone_sequence)`.

| Logical task key | Trigger | Suggested SLA | Completion evidence |
|---|---|---|---|
| `review_application` | New application | next business day | operator assessment |
| `verify_route_and_experience` | Review open | 1 business day | qualified affiliate/broker path |
| `send_welcome_manual` | Approved | 1 business day | actual sent provider message |
| `verify_access` | Onboarding started | 2 business days | verified sign-in/access record |
| `deliver_training` | Access verified | 2 business days | training invitation/receipt |
| `complete_compliance` | Onboarding underway | 3 business days | accepted terms/requirements |
| `configure_tracking` | Compliance ready | 1 business day | valid live tracking identifier |
| `verify_first_referral_ready` | Prerequisites satisfied | 2 business days | operator activation check |
| `no_response_48h` | Actual message sent; no reply | 48 h after send | response/cancel/suppression |
| `nurture_7d` | No response after prior step | 7 days | owner decision |

Do not generate all rows for each contact in every CRM. Instead use one canonical logical task, and mirror into HubSpot and Wix only where operations require it, with durable `external_task_id` mapping and conflict protection. Existing user tasks take precedence over creation. Future task windows calculate from actual event timestamps (not backdated form date). Pause tasks when completed, replied, rejected, unsubscribed, suspended, or owner-paused.

## 6. Event-driven automation contracts

Event envelope: `event_id`, `org_id`, `partner_id`, `event_type`, `occurred_at`, `source`, `source_record_id`, `correlation_id`, `workflow_version`, `payload_version`. Store immutable evidence references and redacted payload; no API tokens or secrets in events.

| Event | Internal action | External side effects |
|---|---|---|
| `partner.application_received` | email match, deduplicate submission, route review queue | upsert existing Notion/CRM only if configured and verified |
| `partner.review_approved` | set approval evidence; checklist init | create one manual welcome task |
| `partner.onboarding_started` | checklist open | internal ops task only |
| `partner.access_verified` | record account/organization identity | training/terms tasks |
| `partner.compliance_completed` | mark prerequisite | internal tracking review |
| `partner.tracking_issued` | record actual link identifier | allow activation review |
| `partner.activated` | advance state | activate appropriate private dashboards |
| `partner.referral_received` | link referral and partner safely | BrokerFlow funding intake only with separate case consent |
| `partner.reply_received` | suppress no-response steps | close matching pending reminder |
| `partner.suspended` | block onboarding actions | cancel outbound and task triggers |

Each action must have an idempotency key, retry limit, dead-letter review queue, traceable audit event, and organization-aware RBAC check. Partial integration failure must be visible and retryable; do not mark lifecycle transitions successful solely on a downstream HTTP 200 without checking the response contract.

## 7. Deployment and rollout

1. **Schema and permissions inventory:** inspect existing `platform-core` tables, RLS policies, edge function, replay keys, and current operator tasks before migrations. Prefer additive changes; no duplicate partner tables.
2. **Read-only reconciliation:** exact email, Tally ID and partner ID across Supabase/Notion/HubSpot/Wix/Sheets. Propose links and conflicts; no silent merging of ambiguous identities.
3. **Event ledger and identity mappings:** transactional state transitions and deduplication; SQL tests for duplicate Tally deliveries and parallel review.
4. **Review UI:** queue, record reconciliation, state evidence, manual approval, access verification and operator audit trail; role-isolation tests.
5. **Wix segment and pipeline rollout:** separate **Partner Recruitment & Activation** pipeline from existing **Funding Submissions** and **To Do Tasks**; build only when native Wix supports the intended partner card and associations. Preserve existing two pipelines.
6. **Task engine:** task templates, per-system identity map, scheduler, cancellation; verify no duplicate task creation across CRM surfaces.
7. **Automations:** start in dry-run, then opt in only internal tasks, then audited outbound communications after consent and copy approval. No messages sent on deployment or by one-off replay.
8. **Quality gates:** `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, Supabase RLS and idempotency integration tests; production smoke must use synthetic IDs and avoid real customer outreach.

### Acceptance tests
- Repeated Tally submission leaves 1 application/partner and 1 logical review task.
- Same person appears in Wix/HubSpot/Notion but maps to 1 partner via verified IDs.
- Notion approval alone never grants membership, activates tracking or sends an email.
- A person with marketing status `NOT_SET` is never auto-enrolled in a promotional campaign.
- One response event cancels future no-response tasks.
- BrokerFlow referrals cannot leak cross-organization or create a funding case without qualifying consent.
- Funding sales pipeline and preinstalled Wix automations are untouched.
- Outbound automation defaults to disabled and can be inspected/paused.

## 8. Dover Moore — baseline reconciliation fixture (not a synthetic person)

- Tally: `mOe658` / `Kp48A9k`, submitted 2026-10-18.
- Email: `33moorelux@gmail.com`; phone: `+16199635176`; La Mesa, California.
- Notion partner ID: `MS-P-20261018204744-B79F3B08`; page `3fd4bc1b-d63c-819c-80cb-f84f98d41247`; approval `approved`; operational status `New Lead`.
- HubSpot contact `256196817505`; existing task `118918841233` — **reuse; do not add duplicate**. Associated note discrepancy remains unresolved.
- Wix contact `52565bfb-5062-47ad-be5d-cb9f24212081`; existing labels: Affiliate Prospect, Affiliate Program; onboarding context note added.
- Source channel: YouTube; sales experience answer: No; bio self-reports financial-services experience. Treat as a qualification discrepancy.
- No confirmed portal access, issued tracking link, outreach sent, first referral or funded deal.
- For current state: keep `approved` distinct from `activated`; onboarding pending. **Do not auto-trigger email or create duplicate tasks from this specification.**

## 9. Compatibility / change management

Version workflow transitions and event schemas; support additive rollout and rollback of automation flags. Document external mapping ownership and allow selective sync. Preserve existing Notion lead router, Tally relay and Vercel routes. Review the implementation against the current deployed schema and linked Vercel secrets before activation. Never claim completion, merge success or live automation before CI and connector readback confirm it.
