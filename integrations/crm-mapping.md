# CRM Mapping Blueprint

This file maps Moonshine Partner Command Center static objects into a future CRM implementation.

> Status: blueprint only. No CRM is connected by this repo.

## Recommended CRM object model

```text
Partner
Lead
Activity Event
Marketplace Offer
Resource
Compliance Review
Integration Task
Commission Record
```

## Object: Partner

### Purpose

Represents a person, company, affiliate, referral partner, center of influence, broker, or operator participating in the partner ecosystem.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `partner_id` | Text | Yes | Public stable ID, e.g. `MS-FB-1024` |
| `contact_name` | Text | Yes | Primary contact |
| `email` | Email | Yes | Unique or semi-unique |
| `phone` | Text | No | Optional |
| `company` | Text | Yes | Company / brand |
| `partner_type` | Select | Yes | Funding broker, referral partner, affiliate, COI, operator |
| `partner_path` | Select | Yes | Submit leads, make intros, promote links, client readiness, ops review |
| `primary_audience` | Text | Yes | Audience served |
| `channels` | Multi-select | No | Newsletter, direct, referral, social, events, widget |
| `status` | Select | Yes | Pending review, active, needs info, paused, archived |
| `source` | Text | No | Tally, direct, referral, affiliate, event |
| `joined_at` | DateTime | Yes | Created timestamp |
| `last_active_at` | DateTime | No | Last event timestamp |
| `compliance_acknowledged_at` | DateTime | Conditional | Required before activation |
| `affiliate_disclosure_acknowledged_at` | DateTime | Conditional | Required for affiliate/referral promotion |
| `permission_acknowledged_at` | DateTime | Conditional | Required before lead submission |
| `review_notes` | Long text | No | Operator review |
| `risk_level` | Select | No | Low, medium, high |

## Object: Lead

### Purpose

Represents a partner-attributed business funding inquiry.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `lead_id` | Text | Yes | Backend-generated ID |
| `partner_id` | Text / relation | Yes | Related Partner |
| `business_name` | Text | Yes | Business name |
| `contact_name` | Text | Yes | Authorized contact |
| `email` | Email | No | Contact email |
| `phone` | Text | No | Contact phone |
| `industry` | Text | No | Business industry |
| `monthly_revenue_estimate` | Currency | No | Estimate only |
| `time_in_business` | Text | No | Example: 3 years |
| `funding_need_estimate` | Currency | No | Estimate only, not approved amount |
| `use_of_funds` | Long text | No | Funding purpose |
| `timeline` | Select | No | Immediate, 2 weeks, 30 days, 60–90 days, planning |
| `status` | Select | Yes | New, reviewing, needs info, submitted, funded, declined, archived |
| `source` | Text | Yes | Widget, partner access, Tally, warm intro, affiliate content |
| `consent_confirmed` | Boolean | Yes | Required for live routing |
| `consent_captured_at` | DateTime | Conditional | Required when consent is true |
| `created_at` | DateTime | Yes | Created timestamp |
| `updated_at` | DateTime | Yes | Last update |
| `next_action` | Text | No | Operator follow-up |
| `notes` | Long text | No | No sensitive data |
| `restricted_data_flag` | Boolean | No | True if sensitive data detected |
| `risk_level` | Select | No | Low, medium, high |

## Object: Activity Event

| Field | Type | Notes |
| --- | --- | --- |
| `event_id` | Text | Unique event |
| `event_type` | Select | Created, updated, copied link, submitted widget, status change |
| `partner_id` | Relation | Optional |
| `lead_id` | Relation | Optional |
| `actor_type` | Select | Partner, operator, system, webhook |
| `actor_name` | Text | Human-readable actor |
| `message` | Text | Short event message |
| `metadata` | JSON | Raw context |
| `created_at` | DateTime | Timestamp |

## Object: Compliance Review

| Field | Type | Notes |
| --- | --- | --- |
| `review_id` | Text | Unique review ID |
| `target_type` | Select | Partner, lead, offer, resource, script, widget, page |
| `target_id` | Text | Related item |
| `severity` | Select | Low, medium, high |
| `rule` | Text | Rule violated or reviewed |
| `flagged_phrase` | Text | Optional |
| `recommendation` | Long text | Safer rewrite or action |
| `status` | Select | Open, in review, resolved, archived |
| `owner` | User/text | Reviewer |
| `created_at` | DateTime | Timestamp |
| `resolved_at` | DateTime | Optional |

## Status lifecycle

### Partner

```text
pending-review → active
pending-review → needs-info
pending-review → needs-review
active → paused
paused → active
any → archived
```

### Lead

```text
new → reviewing
reviewing → needsInfo
reviewing → submitted
submitted → funded
submitted → declined
any → archived
```

## Sync rules

1. Static demo records should never be synced into production without explicit migration.
2. Partner ID must be validated before lead creation.
3. Lead status changes should create immutable activity events.
4. Partners should not directly write provider/lender status fields.
5. Commission status should be separate from lead status.
6. Sensitive data should trigger a review flag.
7. Consent must be captured before live routing.

## Compliance copy for CRM forms

Use this near live lead submission fields:

> Funding options may vary. Submitting information does not guarantee approval, funding, rates, terms, timelines, lender review, or commissions. Only submit information you have permission to share.
