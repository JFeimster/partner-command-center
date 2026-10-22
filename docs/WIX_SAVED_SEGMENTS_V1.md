# Moonshine Capital — Wix Saved Segments & Automation Operating Blueprint

> **File:** `docs/WIX_SAVED_SEGMENTS_V1.md`  
> **Revision:** 1.1 — 2026-10-22 · expanded catalog and implementation contract (filename retained to avoid breaking links)  
> **System:** Moonshine Capital / Distilled Funding · Wix site `cc61a0cb-edcd-43dc-bdda-42c76443dcd6`  
> **Status:** Design and source-of-truth specification; **not** an assertion that these native saved segments or outbound automations are already live.

## 1. Executive recommendation

Build **two complementary segmentation layers**, rather than a parallel CRM inside Wix:

1. **Operational, event-backed segments:** controlled lifecycle values projected from Partner Command Center and BrokerFlow/platform-core. Use for queues, review, routing, compliance suppression, and appropriately confirmed next steps.
2. **Audience and acquisition segments:** historical Wix `TYPE ·` / `INTENT ·` / `SOURCE ·` / `PROGRAM ·` labels, real group membership, and Wix subscription status. Use to discover interest cohorts and *consent-eligible* audiences, not to infer applications, approvals, eligibility, or funding decisions.

A **saved dynamic segment is a filtered view**, not a state change or a reliable event. Trigger automations from real submissions, authenticated upstream transitions, approved membership, confirmed referrals, or explicit communication actions. The filter tells an operator whom to view; the source event tells an automation what happened.

**Do not create all proposed segments blindly.** Prioritize operator-useful views with populated, trustworthy data and consolidate overlapping views. Candidate catalogs below intentionally include future use cases so they can be implemented without inventing fields today.

### 1.1 Inputs reconciled

- **Attachment A:** *Moonshine Capital — Contact Segmentation & Automation Plan.md*: 16 proposed segments across funding, affiliates, audience and lifetime value; six priority automation concepts; differentiation between marketing consent and transactional updates.
- **Attachment B:** *Moonshine Capital — Segments Using Existing Wix Labels.md*: 17 label-based segment ideas, originally based on 208 labels (141 date-specific event labels). Its blanket recommendation to preserve every legacy label **does not apply** to the current cleanup policy.
- **Previous revision:** 13 operational segment contracts in this file.
- **Live Wix read on 2026-10-22:** **57 labels**, **30 extended-field definitions**, including renamed `SOURCE ·` / `INTENT ·` / `PROGRAM ·` / `TYPE ·` / `ACTION ·` labels. Earlier 208-label and four-segment figures are *historical*, not present-day inventory counts.
- **Earlier contact scan:** 4,013 Wix contacts checked, with no populated values in Partner Status, Partner Type, Partner Application Status, Lead Status, or Funding Stage.
- **Earlier platform-core snapshot:** 53 partner rows all flagged fictional; zero real partner applications, funding leads, or BrokerFlow deals in the inspected tables. These are point-in-time findings, not permanent facts.
- **Repository reality:** Outbox and event-derived projection were merged via [PR #95](https://github.com/JFeimster/partner-command-center/pull/95), but production Wix credentials and a genuine end-to-end event were not verified. This document must never be used to claim live outbound synchronization or native saved segment creation.

### 1.2 What changed from the old plan

| Previous idea | Revised treatment | Reason |
| --- | --- | --- |
| `partner_status = applied / approved` | Use **Partner Application Status** for `new / needs_review / onboarding / approved`; reserve **Partner Status** for `pending / active / paused / terminated` | Intake decision is not portal activation |
| `funding_stage = funded / declined / offer_presented` | Future *verified provider/deal outcome* only | Existing BrokerFlow mirror supports `intake_captured / review_requested / documents_pending`; no such funded/declined stage exists in that projection |
| `referrals_90d`, `renewal_eligible`, `activation_status` | Future source-owned metrics with explicit definitions | Not verified as Wix fields or live projections |
| Historical label implies live qualification | Historical acquisition/interest cohort only | Source, interest and activity are not underwriting or intake evidence |
| `Subscriptions` label implies email permission | Wix **Effective Subscription Status** plus deliverability checks | Imported/legacy labels are not consent |
| Keep all 208 old labels | Retain useful provenance and native memberships; merge/rename/delete **obsolete or misleading** artifacts after impact review | Live label inventory is now 57; prior names have changed |
| Create a new Wix field for every segmentation idea | Reuse present field schema and compute specialized metrics upstream | Reduces schema clutter, privacy exposure and competing state ownership |
| Entering a saved segment starts an automation | Authenticated **event** starts the workflow, with idempotency and suppression | Avoids blasting existing contacts after backfill |

## 2. Source ownership, privacy and event model

| Data or decision | Authoritative source | Wix responsibility |
| --- | --- | --- |
| Partner operational status/type, portal activation, organization, referrals | **Partner Command Center** / platform-core | Mirror approved controlled strings, show appropriate partner audiences |
| Partner application receipt/review/approval | Canonical `partner_applications` intake | Mirror **Partner Application Status**, not Partner Status |
| Funding lead status, borrower identity and eligibility review | **BrokerFlow / platform-core** | Mirror allowable Lead Status for contact-level reporting |
| Deal pipeline, documents pending, provider outcomes | **BrokerFlow**, with verified provider data | Mirror existing Funding Stage values; later outcome fields only after supported integration |
| Source labels, Wix group/event/program participation, site content | **Wix** | Derive interest and community cohorts without claiming commercial conversion |
| Email opt-in, delivery suppression, unsubscribes | **Wix consent and communications preferences** | Apply authoritative subscription/deliverability rules at send time |
| CRM contact/deal tasks and personalized outreach | **HubSpot / operating workflow**, where connected | Avoid duplicate tasks; preserve contact/deal associations upstream |
| Source of truth for bank linking, bank data, revenue, documents | Secure applicant/provider workflow | **Do not replicate sensitive raw financial details into Wix labels** |

**Role collision:** a person can simultaneously be a funding applicant, broker, course member, or affiliate. The single Wix `Contact Type` text field is an imperfect one-value projection; never overwrite another role or assume it captures a complete multi-role identity. Prefer distinct domain fields/labels and canonical associations.

**PII:** do not label every lifecycle or source field "PII" by default; classify data based on actual contents and Wix policy. Names, emails, identity documents, bank statements, account identifiers and sensitive details deserve stricter treatment. Store document/bank-link facts and routing notes only in access-controlled applicant systems. Never use a Wix segment to expose underwriting details to public users.

### 2.1 Live Wix field keys (verified 2026-10-22)

| Wix field | Actual key | Type | Intended use |
| --- | --- | --- | --- |
| Partner Application Status | `custom.partner-application-status-xjcrhapo` | TEXT | Exact canonical application status |
| Partner Status | `custom.partner-status-aqgsprsuyxigeupsffng` | TEXT | Canonical partner operational status |
| Partner Type | `custom.partner-type-ofupshmfvqlhfypumeytfe` | TEXT | Canonical partner classification |
| Lead Status | `custom.lead-status-eyvsodtqmzhliowvkrkwhlu` | TEXT | Canonical lead status |
| Funding Stage | `custom.funding-stage-kevpmtfjtluxpcpnhgtzb` | TEXT | Supported BrokerFlow pipeline value |
| Contact Type | `custom.contact-type-fthrfdxphfogegdztkapds` | TEXT | Advisory, single-value classification |
| Funding Interest | `custom.funding-interest-hojgbiqfrkiykahgkz` | TEXT | Audience interest **only** if reliable and populated |
| Lead Source | `custom.lead-source-zcrhbqpohwzdpupzmoogcip` | TEXT | Attribution; preserve original/first-touch source |
| External CRM ID | `custom.external-crm-id-ynriagpsvpziodgatkb` | TEXT | Linked identity; only use a verified mapping |
| Next Follow-Up Date | `custom.next-follow-up-date-rwtshjyidlrraqr` | DATE | Internal queue **only after** task sync established |
| Last Follow-Up Date | `custom.last-follow-up-date-tmcsdykkbhgjhxe` | DATE | Actual completed actions, not simply drafted emails |
| Business Revenue | `custom.business-revenue-cxmcivtgjxkallwczq` | NUMBER | Existing but **not** a reason to propagate financial details |
| Funding Requested | `custom.funding-requested` | NUMBER | Use only confirmed applicant-supplied amounts |
| Membership Status | `members.membershipStatus` | TEXT | Native membership state, validate Wix UI semantics |
| Effective Subscription Status | `emailSubscriptions.subscriptionStatus` | TEXT | Authoritative marketing opt-in test |
| Effective Deliverability Status | `emailSubscriptions.deliverabilityStatus` | TEXT | Suppress undeliverable email |

Wix Contacts extended fields are **text/date/number/URL**, not true selectable enums. The authoritative Partner Command Center uses dropdowns and database validation; Wix receives exact canonical strings. Confirm that each particular property appears as a filter in the **actual Wix Manage Segments UI** before attempting to save the corresponding view. A field existing in the API does not prove the UI exposes every operator.

### 2.2 Controlled values actually supported by the current worker

| Domain | Controlled values | Warning |
| --- | --- | --- |
| Partner Status | `pending`, `active`, `paused`, `terminated` | `approved` is not a partner operational state |
| Partner Type | `funding_broker`, `referral_partner`, `affiliate_partner`, `center_of_influence`, `professional_service_provider`, `community_connector`, `internal_operator`, `unknown` | Classification is controlled in Partner Command Center |
| Partner Application Status | `new`, `needs_review`, `qualified`, `onboarding`, `approved`, `declined`, `nurture` | Review/approval does not prove activation |
| Lead Status | `new`, `qualified`, `nurture`, `referred`, `won`, `lost`, `archived` | `won` is not independently verified funded |
| Funding Stage | `intake_captured`, `review_requested`, `documents_pending` | No funded, declined, underwriting, incomplete, or offer stage in the current Wix projection |

Do **not** invent extra values inside Wix in order to make a suggested segment work. Extend and verify the canonical system first, then add the mirror with a migration/event contract.

## 3. Segment catalog — operational source-of-truth views

**Legend:** `P0` = critical operator queue/suppression; `P1` = next high-value; `P2` = supporting. **Ready to define** means the field/key exists and the filter has a controlled value; it does **not** mean matching records or a saved Wix segment exists. All segments in this section are **internal** by default; do not use them as campaign recipient lists without a separate consent check.

| ID | Priority | Saved segment | Dynamic predicate in Wix | Primary action / owner |
| --- | --- | --- | --- | --- |
| O01 | P0 | **OPS · Partner Applications — Review** | Partner Application Status = `new` OR `needs_review` | Partner operator intake queue |
| O02 | P1 | **OPS · Partner Applications — Onboarding** | Partner Application Status = `onboarding` | Operator onboarding checklist |
| O03 | P1 | **OPS · Partner Applications — Approved** | Partner Application Status = `approved` | Confirm actual portal activation; never auto-set `active` |
| O04 | P0 | **OPS · Partners — Pending** | Partner Status = `pending` | Verify approval, identity, and onboarding |
| O05 | P1 | **OPS · Partners — Active** | Partner Status = `active` | Partner support; no inferred referrals |
| O06 | P0 | **OPS · Partners — Paused** | Partner Status = `paused` | Suspend partner campaigns/referral invitations |
| O07 | P1 | **OPS · Funding Brokers** | Partner Type = `funding_broker` | Broker enablement; combine with Active when applicable |
| O08 | P1 | **OPS · Referral Partners** | Partner Type = `referral_partner` | Referral resources; combine with Active when applicable |
| O09 | P2 | **OPS · Affiliates** | Partner Type = `affiliate_partner` | Affiliate education; do not infer activity |
| O10 | P1 | **OPS · Funding Intake Captured** | Funding Stage = `intake_captured` | BrokerFlow intake queue |
| O11 | P0 | **OPS · Funding Review Requested** | Funding Stage = `review_requested` | Funding review/task routing |
| O12 | P0 | **OPS · Funding Documents Pending** | Funding Stage = `documents_pending` | Confirm document-specific request securely |
| O13 | P2 | **OPS · Funding Nurture** | Lead Status = `nurture` | CRM follow-up; marketing needs consent |
| O14 | P0 | **OPS · Funding New Leads** | Lead Status = `new` | Acknowledge *real new event* and assign operator |
| O15 | P1 | **OPS · Funding Qualified Leads** | Lead Status = `qualified` | Broker review; not underwriting approval |
| O16 | P0 | **OPS · Partners — Terminated** | Partner Status = `terminated` | Suppress partner-only onboarding/access campaigns |
| O17 | P1 | **OPS · Partner Applications — Declined** | Partner Application Status = `declined` | Status reconciliation and suppression; not a partner `terminated` event |
| O18 | P2 | **OPS · Partner Type — Unclassified** | Partner Type = `unknown` | Human classification task, if the source has a real verified record |

**UI fallback:** if combined `OR` conditions for O01 are not expressible as intended in Wix, build two clearly named operational views or configure the combined queue upstream. Do not silently change `OR` to `AND`.

**Merge/avoid:** O14 supersedes the old speculative `FND · New Funding Leads` when actual `Lead Status=new` is available; O12 already covers the proposed `Missing Documents`; O05 alone is **not** the same as the proposed “Active Referral Partners” cohort, which requires a verified referral count.

## 4. Segment catalog — existing Wix labels and community interest

The old 17-segment attachment used label display names that have since been **renamed**. The names below are the **current live Wix labels** returned 2026-10-22. The key remains the better durable identifier for a programmatic migration; the user-facing dashboard filter must be confirmed after label cleanup.

All `OR` clauses mean any matching label. Interest does **not** imply recent intent, eligibility, live application, confirmed service purchase, membership access, or marketing consent.

| ID | Priority | Candidate saved segment | Current Wix label predicate (OR) | Intended use |
| --- | --- | --- | --- | --- |
| L01 | P1 | **FND · Historical Funding Prospect Sources** | `TYPE · Funding Lead`; `SOURCE · Funding Assessment`; `SOURCE · Personalized Funding Quote`; `SOURCE · Application Form` | Legacy lead inventory, dedupe, optional requalification |
| L02 | P0 | **FND · Needs Qualification Label Queue** | `ACTION · Needs Qualification` | Audit old labels against actual current lead status; do not auto-email |
| L03 | P1 | **FND · Gig Worker Funding Interest** | `INTENT · Gig Worker Funding`; `SOURCE · DoorDash`; `SOURCE · DAC Gig Funding Form` | Gig funding education; source labels require confirmation of interest |
| L04 | P2 | **FND · Ecommerce Funding Interest** | `INTENT · Ecommerce Funding`; `SaaS & Ecommerce Funding Group member` | Shopify, marketplace, and seller funding topics |
| L05 | P2 | **FND · Real Estate Capital Interest** | `SOURCE · Real Estate Approval Form`; `Real Estate Mastermind Group member`; `Real Estate Mavericks Group member` | DSCR and investment-property finance content; do not imply application |
| L06 | P2 | **FND · Equipment and Invoice Interest** | `SOURCE · Equipment Financing Form`; `SOURCE · Invoice Financing Form` | Product-specific education / prospective intake |
| L07 | P1 | **AFF · Historical Partner Prospects** | `TYPE · Affiliate Prospect`; `SOURCE · Partner Application`; `SOURCE · Partnership Inquiry` | Recruitment inventory; not the live partner application queue |
| L08 | P2 | **AFF · Affiliate Network Audience** | `PROGRAM · Affiliate Network`; `Partner Program Group member`; `DAC Affiliate Agency Group member`; `DAC  Group member` | Partner network interest; active status must come from PCC |
| L09 | P2 | **AFF · Partner Orientation Interest** | `PROGRAM · Partner Orientation` | Resource access / attendance check, not automatic activation |
| L10 | P2 | **AFF · Broker Training Audience** | `PROGRAM · Funding Biz Q&A + Launch Plan`; `Funding Coach  Group member` | Training invitations with consent; obsolete dated event labels excluded |
| L11 | P2 | **AUD · Business Credit Interest** | `Build Your Business Credit Group member`; `Credit Repair Training Course Group member`; `PROGRAM · 50 Credit Lines On Demand` | Education, explicitly not credit repair or scoring guarantee |
| L12 | P2 | **AUD · AI and Funding Automation Interest** | `AI Tools & Resources Group member`; `AI Prompt Library Group member`; `SOURCE · Funding Automation n8n`; `SOURCE · CustomGPT Lead Capture` | Tools, automation and content |
| L13 | P2 | **AUD · Business Acquisition Interest** | `Buy/Sell Business Group member` | Acquisition financing and seller transition content |
| L14 | P2 | **COM · Confirmed Wix Group Members** | `Moonshine Capital Group member` | Community onboarding. Do **not** add `SOURCE · Facebook Groups` as proof of group membership |
| L15 | P2 | **AUD · Funding Education Audience** | `PROGRAM · Free Funding Masterclass`; `Non-Dilutive Growth Capital Group member` | Funding education and next-step content |
| L16 | P1 | **ENG · Wix Chat Inquiries** | `SOURCE · Wix Smart Chat`; `SOURCE · Inbound Chat` | Triage inbound questions; use original chat event for response SLA |
| L17 | P2 | **ENG · Newsletter Acquisition Sources** | `SOURCE · Newsletter Signup`; `SOURCE · Legacy Subscription Form`; `SOURCE · Legacy Subscription Form 2` | Provenance analysis **only**; actual subscribers must be determined from Wix consent fields |

### 4.1 Accurate label provenance rules

- `SOURCE · ...` means **origin or historical form/source**, not application completion or current interest. Do not use it to overwrite a newer, verified lead source.
- `TYPE · ...` is a *legacy classifier*, not an authority to set Partner Command Center status or create a HubSpot funding deal.
- `PROGRAM · ...` does not necessarily prove completion, attendance, certification, login or approval.
- Native Wix `... Group member` labels are stronger membership signals than a manually created “source” label, subject to reconciliation with native group membership.
- `ACTION · Needs Qualification` is an old work-queue marker; remove or retire it when the genuine qualification task is closed rather than treating it as a permanent profile.
- `SOURCE · Facebook Groups` can support an **acquisition channel** report but must **not** be added to L14.
- Source labels for legacy forms that are now disabled should not trigger new-form workflows.
- The historical 141 date-specific event labels are not in the currently returned 57-label set; do not rebuild dozens of event filters or silently restore those labels.

### 4.2 Audience safe-to-contact overlay

For a marketing audience derived from any `L` segment, intersect with the *current* Wix `Effective Subscription Status` indicating permission, `Effective Deliverability Status` indicating a deliverable destination, and campaign suppression rules. Confirm the exact status values/operators in the live Wix UI. **Never treat a legacy newsletter or affiliate source label as opt-in.** A previously unsubscribed contact must not be re-added to marketing via contact update, synchronization or segment matching.

## 5. Proposed next-wave segments — gated by source data

These expand the attached plan without pretending the data exists today. **Do not create a new Wix custom field until the canonical event and operator use case exist.** Keep an upstream operational query or report when a Wix segment would expose undue data or have no recipient-action purpose.

| ID | Priority | Proposed view | Required verified source / condition | Launch gate |
| --- | --- | --- | --- | --- |
| X01 | P1 | **FND · Application Started / Incomplete** | Real provider/application event `started` and independently verified `not_completed` | Canonical state and timestamps; not `Lead Status=new` |
| X02 | P1 | **FND · Bank Connection Action Needed** | Verified provider connection state with action-required event | Prefer secure upstream task; only mirror non-sensitive boolean if justified |
| X03 | P1 | **FND · Offer Presented / Needs Review** | Verified real offer presentation and recorded owner | Provider outcome event, not existing `Funding Stage` |
| X04 | P2 | **FND · Declined / Alternative Route Review** | Verified provider disposition and suitability review | Human approval, opt-in for any marketing; never treat `lost` as lender decline |
| X05 | P1 | **AFF · Approved / Not Activated** | Application `approved` AND verified *portal activation state = incomplete* | Portal activation event separate from `Partner Status=pending` |
| X06 | P1 | **AFF · Active Referral Producers** | Partner `active` AND confirmed `referrals_90d > 0` | Referral-event accounting and time window |
| X07 | P2 | **AFF · Active Without Referrals** | Partner `active` AND verified `referrals_90d = 0` | Explicit zero means measured zero, not missing data |
| X08 | P2 | **AFF · First Referral Submitted** | Authenticated partner referral event and verified attribution | Idempotent reward/resources workflow; no unearned commission promise |
| X09 | P2 | **LTV · Verified Funded Clients** | Verified funding/disbursement event | Separate outcome model; `won` does not establish funding |
| X10 | P2 | **LTV · Capital Review / Renewal Window** | X09 AND verified renewal suitability/time and applicable consent | No guessed renewal eligibility; operator review |
| X11 | P3 | **LTV · Dormant, Contactable Audience** | Last verified engagement older than 90 days AND current permission | Frequency caps and recent-reply exclusion |
| X12 | P2 | **FND · Second Opinion / Provider Delay** | Applicant explicitly reports provider delay or requests second opinion | Confirmed note/event; manual owner review |
| X13 | P2 | **FND · Larger Capital Needs** | Reliable amount + optional business context; appropriate channel | Manual consultation invitation; no inference of eligibility from amount |
| X14 | P3 | **AUD · Content to Consultation Intent** | Explicit webinar/booking click or completed request with timestamp | Real tracked events, not merely group membership |
| X15 | P3 | **OPS · Follow-Up Overdue** | Verified owned task + Next Follow-Up Date elapsed + incomplete status | HubSpot/BrokerFlow task sync before trusting Wix date |
| X16 | P2 | **OPS · Duplicate / Unmapped Identity** | Outbox `needs_mapping` or verified duplicate Wix email | **Operator dashboard / secure queue**, not a public-facing segment |

**Not a planned Wix field:** `referrals_90d`, `activation_status`, `renewal_eligible`, `email_last_engaged_at`, provider bank-link status and raw underwriting outcome should remain upstream until a legitimate, minimized segment use case is demonstrated.

## 6. Automation registry — trigger-based, cross-platform, opt-in safe

**Automation ≠ segment.** Configure a source-event-driven workflow, deduplicate on `(source, organization, event_id, action_type)`, check current state immediately before executing, and write delivery/action status back to the owning platform. A saved segment is an operator view or recipient selector, not the only trigger.

**Run modes:** `Operator` = internal task/notification only; `Transactional` = operational receipt/next-step information after verified request; `Marketing` = promotional/educational and always subject to express Wix communication eligibility; `Human` = draft or reviewed action only.

### 6.1 Partner acquisition, onboarding and retention

| ID | Priority | True trigger / source | Automation action | Mode / cancellation gate |
| --- | --- | --- | --- | --- |
| A01 | P0 | Verified **Become a Partner** Wix form submission successfully ingested as `partner_applications` | Confirm receipt, create or associate existing contact/application, create one review task | Transactional + Operator; don't claim platform-core receipt until successful canonical ingestion |
| A02 | P0 | Partner application status changes to `needs_review` | Owner task with form source, review link and due time | Operator; one open task per application/stage |
| A03 | P1 | Partner application becomes `qualified` | Notify partner operator to review the proper broker/affiliate lane | Operator; no automatic approval |
| A04 | P1 | Partner application moves to `onboarding` | Send approved resource/checklist link only when access is actually provisioned | Transactional; cancellation on withdrawn/declined |
| A05 | P1 | Application becomes `approved` | Check portal account and invite provisioning; queue review if incomplete | Operator; `approved` is not `active` |
| A06 | P1 | Verified portal activation + Partner Status becomes `active` | Partner welcome/resource access and onboarding checklist | Transactional; send once; respect suppression |
| A07 | P2 | Partner classification changed (type only) | Recalculate resources and operator views; flag conflicting historical labels | Operator; do not send another welcome |
| A08 | P2 | First authenticated referral reaches accepted intake | Confirmation and suggested next steps; record attribution | Transactional; no unverified commission/payout claims |
| A09 | P2 | Verified 30/60-day no-referral signal for active partner | Create reactivation task, or opt-in training invitation | Operator / Marketing; no activity assumptions when metrics missing |
| A10 | P0 | Partner `paused` or `terminated` | Suppress onboarding/referral promotions; review pending tasks/access | Operator; do not silently revoke unrelated Wix memberships |

### 6.2 Funding intake and applicant progression

| ID | Priority | True trigger / source | Automation action | Mode / cancellation gate |
| --- | --- | --- | --- | --- |
| A11 | P0 | Verified new funding lead created upstream | Send brand-safe receipt; create search-first associated intake review task | Transactional + Operator; no invented funding deal or amount |
| A12 | P0 | Lead marked `new` and **actually requires qualification** | Assign owner and request missing basic details through approved channel | Operator; old `ACTION` label alone does not prove a new event |
| A13 | P1 | Verified funding next-step/application link **sent** | Next business-day confirmation task; save link sent and event time | Operator; do not infer sent from template draft |
| A14 | P1 | Real application `started`, not completed after 24–48h | One reminder using correct link, only after verifying incomplete state | Transactional; cancel if complete/withdrawn |
| A15 | P1 | Provider confirms bank connection action needed | Create human bank-link check task / secure portal reminder | Operator / Transactional; do not transmit bank information to Wix |
| A16 | P0 | Verified `documents_pending` + named missing item | Create secure missing-doc task; request upload via authenticated portal | Operator / Transactional; never send private docs by insecure email |
| A17 | P1 | Review requested or provider underwriting update verified | Check status and create 1–2-business-day owner follow-up | Operator; do not invent offer/underwriting stage |
| A18 | P2 | Verified offer presented or needs acceptance | Human-owned offer explanation and follow-up task | Human; no automated suitability decision |
| A19 | P2 | Confirmed decline/withdrawal, with safe alternate route | Human evaluation of second funding lane; optionally draft message | Human; never auto cross-sell based on sensitive outcome |
| A20 | P2 | Verified funded/disbursed event | Client service check-in and later capital-review task | Transactional / Human; `Lead Status=won` insufficient |

### 6.3 Education, membership, engagement and customer lifetime value

| ID | Priority | True trigger / source | Automation action | Mode / cancellation gate |
| --- | --- | --- | --- | --- |
| A21 | P1 | Genuine new newsletter opt-in recorded by Wix | One welcome sequence with interest/preferences options | Marketing; unsubscribe/undeliverable exclusion |
| A22 | P2 | Verified business-credit, AI, ecommerce, real estate or acquisition interest | Topic-specific resources instead of generic blast | Marketing; use current consent and frequency caps |
| A23 | P2 | Wix native community membership granted | Group access guidance and verified membership link | Transactional; no implied partner approval |
| A24 | P2 | Registration or verified attendance of real event/program | Relevant reminders or recap; distinguish registered from attended | Transactional for registration; Marketing for promotion |
| A25 | P1 | New inbound Wix chat message that needs follow-up | Owner task with response SLA, deduped against open conversation | Operator; never pretend a chatbot label means intent |
| A26 | P3 | Verified client renewal window and permission | Human capital-review invitation with correct context | Human / Marketing; not automatic loan solicitation |
| A27 | P3 | Verified 90-day dormancy with consent and no recent reply | Single capped re-engagement; archive from campaign if silent | Marketing; no inferred current funding need |

### 6.4 Reliability, reconciliation, security and suppression

| ID | Priority | True trigger / source | Automation action | Mode / cancellation gate |
| --- | --- | --- | --- | --- |
| A28 | P0 | Wix sync outbox `needs_mapping` | Open operator reconciliation ticket with source IDs, not raw financial data | Operator; no duplicate contact creation |
| A29 | P0 | Retry limit reached or projection verification failed | Alert integration owner, retain delivery trace, isolate failing event | Operator; no “sent” claim |
| A30 | P1 | Canonical status changed but Wix field stale beyond SLA | Re-read source, compare Wix revision, replay idempotently | Operator; last-write protection and source authority |
| A31 | P0 | Unsubscribe, deliverability failure, closed/withdrawn application, or partner termination | Cancel queued *inapplicable* outreach and suppress campaigns | Safety control; transactional notices only when permitted/necessary |

### 6.5 Operator follow-up sequence templates (not blanket email sends)

| Workflow | Time from confirmed event | Operator action | Exit condition |
| --- | --- | --- | --- |
| New funding intake | Immediately | Brand-safe receipt; associated review task | Intake acknowledged, owner assigned |
| Giggle / BankBreezy link actually sent | Next business day | Confirm started; create bank-link check if applicable | Started/declined/withdrawn |
| No response after first follow-up | 48 hours after first contact | Specific human follow-up task/draft | Reply, completion, opt-out or stage transition |
| Bank connection action required | Same or next business day | Provider status confirmation and secure instructions | Verified connected/not required |
| Documents pending | Same or next business day | Missing-item task with secure upload route | Provider verifies receipt |
| Review/underwriting pending | 1–2 business days | Review status; update note or next-step task | New provider event or closure |
| Parallel Giggle/BankBreezy path | 1–2 business days after initial routing | Confirm whether separate path is appropriate | Owner confirms chosen lane |
| Final inactive follow-up | 3–5 business days after 48-hour task | Final human check or nurture transition | Reply or operator closeout |
| New partner application | Same/next business day | Human qualification and correct partner classification | Review decision |
| Partner approved, not activated | Within 1 business day after evidence | Verify portal invitation, then check activation | Portal activation confirmed |

A task must contain **title, due date/time, owner, status, context, record associations, evidence/source and next action**. Search for an existing task first. Link the actual contact, deal and company only where supported; do not fabricate a company for a gig worker or force a partner application into a funding deal. A drafted email is not a sent email.

## 7. Segmentation hygiene, consolidation and label retirement

The old attachment said “Keep all 208 labels.” That is **superseded**. The live account now has 57 and already uses more coherent prefixes. Preserve history where it affects attribution, active automations, site groups or membership, but **remove misleading clutter after reference and membership checks**.

### 7.1 Keep or normalize

| Label class | Policy | Example |
| --- | --- | --- |
| `TYPE ·` | Keep sparingly as a historical classifier; do not mirror canonical workflow status here | `TYPE · Funding Lead` |
| `SOURCE ·` | Preserve meaningful original attribution, but stop applying obsolete form labels to new submissions | `SOURCE · Partner Application` |
| `INTENT ·` | Keep only where expressed interest was actually captured; do not promote inferred channel source to intent | `INTENT · Ecommerce Funding` |
| `PROGRAM ·` | Keep if active resource/onboarding program; distinguish signup, attendance and completion | `PROGRAM · Partner Orientation` |
| `ACTION ·` | Treat as temporary work marker with a clearing condition | `ACTION · Needs Qualification` |
| Native `... Group member` | Leave under Wix group authority; do not bulk-delete blindly | `Moonshine Capital Group member` |
| `GEO ·` / consent system fields | Only actual current origin/location/consent; no inference from marketing labels | `GEO · International` |

### 7.2 Deletion and archive candidates — not automatic

- Unused **Do Less Earn More**, **Automation Pack n8n**, and **Limited Power of Attorney** forms remain retired; a source label for a retired form is not an active intake trigger.
- `SOURCE · Contact Form (Legacy)`, `SOURCE · Contact 2 Form (Legacy)`, `SOURCE · Legacy Subscription Form` and `... Form 2` should be reviewed for historical attribution and active references. Once safely migrated, remove empty/meaningless legacy labels rather than preserving them by default.
- `SOURCE · Gmail Import (2020-10-09)`, `(2020-12-07)`, `(2021-05-11)` and `EVENT · Funding Without Investors (2020-12-16)` are old provenance; consider consolidating into an archival attribution report instead of retaining noisy live segmentation.
- `DETAIL · Bank in Personal Name` is **not** a suitable public-facing segmentation label: evaluate purpose, permissions and removal while preserving necessary provider routing detail securely upstream.
- Source labels that merely reflect obsolete capture widgets (`SOURCE · Funding Automation n8n`, `SOURCE · CustomGPT Lead Capture`) may be useful for attribution but should not be treated as explicit AI-tool preferences.

**Removal protocol:** before deleting or renaming any label, count assigned contacts, inspect Wix automations and segment filters for references, export an attribution mapping where needed, update dependent filters, and verify Wix group/system-managed ownership. Then archive/rename/delete only unused or misleading labels. Do not mass-retag an entire list based on uncertain classification; do not re-subscribe anyone.

## 8. Exact platform build order and activation gates

### Gate 0 — data/trigger reality check (mandatory)

- Confirm Wix current labels (57 on 2026-10-22), relevant group memberships and available segment-filter operators; inventory saved segments and duplicates before adding any.
- Confirm five operational mirror fields are actually populated *by verified real events*; earlier 4,013-contact check found no such values.
- Confirm Partner Command Center/API authenticated relay can ingest the live **Become a Partner** Wix form: https://jasonfeimster.wixforms.com/f/7451037452602443026. A Wix label and internal task are not evidence of canonical ingestion.
- Confirm production `WIX_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` and URL are configured on the server. The connected Wix ChatGPT token cannot be re-used as an exported API key.
- The Wix automation “Send HTTP request” action, as previously inspected, did not expose a safe custom authentication-header arrangement for the protected intake endpoint. Prefer signed Velo/server-side relay or another authenticated integration, not a public bearer in the URL.
- Check that current canonical upstream schema supports any future proposed state before writing Wix values. No QA `fictional=true` records should be mirrored.

### Gate 1 — initial internal operator catalog

Build **O01, O04, O06, O10, O11, O12, O14, O16** after real status synchronization is verified. Add **O02, O03, O05, O07–O09, O13, O15, O17–O18** only where those filters correspond to actual current records/queries. For empty views, keep the specification and defer a redundant dashboard item rather than proliferating dead filters.

### Gate 2 — usable historical/marketing audience catalog

Build **L01, L02, L03, L07, L16** first for operational discovery and CRM cleanup. For educational distribution add **L04–L06, L08–L15 and L17** only after checking label membership and actual campaign relevance. Campaign recipients require a *separate* current opt-in/deliverability test; L17 alone is not a subscriber segment.

### Gate 3 — activate real event-driven automations

Start with **A01, A02, A11, A12, A16, A28–A31** after source-event and recipient checks; then enable the rest in true workflow order. Avoid a bulk “everyone currently in this segment receives an email” trigger. Configure enrollment filters, re-entry policy, exclusion/suppression, unique event IDs, working-hours logic, review ownership and an opt-out path. Default to **internal tasks/drafts** until the relevant send channel and legal permission are verified.

### Gate 4 — advanced lifetime value and referral analytics

Only when the source systems expose true referral events, portal activation evidence, final lender outcomes and verified renewal eligibility should **X01–X16** be promoted into active workflows. Prefer upstream reporting to redundant Wix fields where no Wix action depends on them.

### 8.1 Acceptance checklist (for each native saved segment)

1. Segment exists as a **saved dynamic Wix segment** (not a static label, spreadsheet, GitHub table or suggested name).
2. Filter names/values match currently deployed fields/labels; `OR` / `AND` precedence and maximum 10-filter limit are respected.
3. Count and sampled membership were reviewed against the canonical source or actual label membership; zero matches are accurately disclosed.
4. A marketing-ready variant has confirmed subscription, deliverability, and suppression criteria; not just the source label.
5. Segment owner, last review date, usage purpose and retirement criterion are documented; no duplicate dashboard views.

### 8.2 Acceptance checklist (for each automation)

1. Trigger is an actual verified **new event** with source ID, event time, organization and relevant record IDs.
2. Idempotent replay does not duplicate messages, follow-up tasks or labels; retries do not mark failures as success.
3. Duplicate/unmapped contacts go to human reconciliation; nobody is matched by unverified name alone.
4. Re-check source state at execution, enforce no-response windows, avoid overlap with existing HubSpot/BrokerFlow tasks and honor cancellation.
5. Suppress contacts who unsubscribed or are undeliverable from **marketing**. Never use an application receipt as a blanket marketing subscription.
6. Sensitive application, revenue, bank-link and document data remain in the appropriate secured system.
7. Source-specific copy uses correct links, sending context and no underwriting/approval/credit/funding promises.
8. Capture outcomes: delivered/not delivered, operator action completed, step completion, qualified applications, activated partners, genuine referrals, and funding outcomes **only when confirmed**.

## 9. Measurements and maintenance

| KPI | Definition | System |
| --- | --- | --- |
| Verified source → Wix match rate | Successfully resolved unique Wix contact / canonical eligible events | Integration outbox |
| Projection delivery success | Synced / processed events, excluding explicit ignored and unresolved identities | Outbox |
| Unmapped/duplicate queue age | Oldest unresolved `needs_mapping` event | Operator queue |
| Lead first-response SLA | Verified intake → first human action | BrokerFlow / tasks |
| Applicant next-step completion | Confirmed completed application or provider step / verified requests | Provider / BrokerFlow |
| Partner review time | Received application → recorded review decision | Partner Command Center |
| Partner activation | Approved applications with verified account activation / approved applications | Partner Command Center |
| Partner referral activation | Active partners with first verified referral, by cohort | Referral system |
| Marketing unsubscribe/delivery quality | Campaign consent, hard bounces, complaint and unsubscribe rates | Wix email |
| Segment usefulness | Active owner, contacts matched, action taken, last used | Wix segment inventory |

**Monthly hygiene:** remove redundant/empty segment definitions with no operational user; compare live label list against this catalog; investigate field-value drift and stale sync; review suppressions and archived legacy source labels; never measure campaign performance from unverified events.

## 10. Links and implementation references

- [Wix Manage Segments](https://manage.wix.com/dashboard/cc61a0cb-edcd-43dc-bdda-42c76443dcd6/segments)
- [Wix Contacts: Creating and Managing Segments](https://support.wix.com/en/article/wix-contacts-creating-a-segment) — dashboard path, logic and 10-filter limit, updated 2026-10-05
- [Source-to-Wix projection contract](./WIX_CONTACT_SYNC_CONTRACT.md) — note that any older claim “Partner Type field does not exist” has been superseded; live field is listed above
- [Event worker](../lib/wix-contact-sync-worker.js) and [authenticated cron endpoint](../api/wix-sync.js)
- [PR #95: event-derived Wix contact sync](https://github.com/JFeimster/partner-command-center/pull/95)
- [Partner application (retained Wix form)](https://jasonfeimster.wixforms.com/f/7451037452602443026)
- Supporting materials supplied by the project owner: *Moonshine Capital — Contact Segmentation & Automation Plan.md* and *Moonshine Capital — Segments Using Existing Wix Labels.md*.

**Scope of this document update:** strategy, inventory reconciliation, names, filters, source fields, automations and acceptance contracts. It does **not** create Wix native segments, send marketing messages, change consent, backfill test records, or declare the event relay fully operational.
