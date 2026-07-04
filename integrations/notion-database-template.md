# Notion Database Template Blueprint

Static blueprint for creating a Notion workspace that mirrors the Moonshine Partner Command Center.

> Status: planning template only. This repo does not create Notion databases automatically.

## Recommended Notion databases

```text
Partners
Leads
Marketplace Offers
Resources
Training Modules
Activity Events
Compliance Queue
Integration Readiness
Commission Examples
Admin Notes
```

## Database: Partners

### Properties

| Property | Type | Notes |
| --- | --- | --- |
| Partner | Title | Company or partner display name |
| Partner ID | Text | `MS-FB-1024` |
| Status | Select | Pending Review, Active, Needs Info, Needs Review, Paused, Archived |
| Partner Type | Select | Funding Broker, Referral Partner, Affiliate Partner, Center of Influence, Operator |
| Contact Name | Text | Primary contact |
| Email | Email | Contact email |
| Phone | Phone | Optional |
| Primary Audience | Text | Audience served |
| Channels | Multi-select | Direct, Referrals, Newsletter, Social, Events, Widget |
| Partner Path | Select | Submit Leads, Make Intros, Promote Links, Client Readiness, Ops Review |
| Source | Select | Tally, Website, Direct, Referral, Affiliate, Event |
| Joined At | Date | Created date |
| Last Active | Date | Activity rollup or manual |
| Compliance Ack | Checkbox | Required before activation |
| Disclosure Ack | Checkbox | Required for affiliate/referral partners |
| Permission Ack | Checkbox | Required before lead submission |
| Leads | Relation | Related to Leads |
| Activity | Relation | Related to Activity Events |
| Review Notes | Text | Operator notes |

### Views

- Active Partners
- Needs Review
- Affiliate Partners
- Centers of Influence
- New This Month
- Partner Type Board

## Database: Leads

### Properties

| Property | Type | Notes |
| --- | --- | --- |
| Lead | Title | Business name |
| Lead ID | Text | Unique ID |
| Partner | Relation | Partners |
| Partner ID | Rollup | From Partner |
| Status | Select | New, Reviewing, Needs Info, Submitted, Funded, Declined, Archived |
| Contact Name | Text | Authorized contact |
| Email | Email | Optional |
| Phone | Phone | Optional |
| Industry | Text | Business industry |
| Monthly Revenue Estimate | Number | Currency format |
| Funding Need Estimate | Number | Currency format |
| Use of Funds | Text | Business purpose |
| Timeline | Select | Immediate, 2 Weeks, 30 Days, 60–90 Days, Planning Ahead |
| Source | Select | Widget, Tally, Partner Link, Warm Intro, Dashboard |
| Consent Confirmed | Checkbox | Required before live routing |
| Created At | Date | Created timestamp |
| Updated At | Date | Last update |
| Next Action | Text | Follow-up |
| Notes | Text | No sensitive data |
| Activity | Relation | Activity Events |

### Views

- Pipeline Board by Status
- New Leads
- Needs Info
- Submitted
- Funded Examples
- Partner Lead Table
- Review Calendar

## Database: Marketplace Offers

### Properties

| Property | Type | Notes |
| --- | --- | --- |
| Offer | Title | Offer name |
| Offer ID | Text | Stable ID |
| Category | Select | Funding, Education, Widget, Automation, Marketing, Integration |
| Status | Select | Draft, Demo, Approved, Needs Review, Archived |
| Allowed Partner Types | Multi-select | Broker, Referral, Affiliate, COI, Operator |
| Summary | Text | Short summary |
| CTA URL | URL | Static or production route |
| Compliance Note | Text | Required |
| Owner | Person/Text | Internal owner |
| Last Reviewed | Date | Review date |
| Related Resources | Relation | Resources |
| Compliance Reviews | Relation | Compliance Queue |

### Views

- Approved Offers
- Needs Review
- By Category
- Partner-Facing Offers

## Database: Resources

### Properties

| Property | Type | Notes |
| --- | --- | --- |
| Resource | Title | Resource name |
| Resource ID | Text | Stable ID |
| Type | Select | Guide, Template, Checklist, Blueprint, Tool |
| Category | Select | Funding Education, Sales Enablement, Readiness, Compliance, Marketing, Integration |
| Partner Types | Multi-select | Broker, Referral, Affiliate, COI, Operator |
| URL | URL | Static route |
| Featured | Checkbox | Featured resource |
| Compliance Note | Text | Required |
| Related Training | Relation | Training Modules |

## Database: Compliance Queue

### Properties

| Property | Type | Notes |
| --- | --- | --- |
| Flag | Title | Flag summary |
| Flag ID | Text | Unique ID |
| Location | Text | Page, script, email, social post |
| Phrase | Text | Flagged phrase |
| Severity | Select | Low, Medium, High |
| Rule | Select | No Guarantee, Privacy, Disclosure, Static Demo, Sensitive Data |
| Recommendation | Text | Safer rewrite or action |
| Status | Select | Open, In Review, Resolved, Archived |
| Owner | Person | Reviewer |
| Created At | Date | Created timestamp |
| Resolved At | Date | Optional |

## Database: Integration Readiness

### Properties

| Property | Type | Notes |
| --- | --- | --- |
| Integration | Title | Integration name |
| Type | Select | Tally, CRM, Widget, API, Webhook, GPT Action, Admin |
| Status | Select | Not Started, Blueprint, Static Prototype, Needs Backend, Ready for Review |
| Readiness % | Number | 0–100 |
| Owner | Person/Text | Internal owner |
| Blockers | Text | Current blockers |
| Next Action | Text | Next implementation step |
| Related Docs | URL | Developer doc link |
| Last Reviewed | Date | Review date |

## Suggested dashboard pages in Notion

1. Partner Ops Home
2. Lead Review Queue
3. Compliance Command Center
4. Marketplace Review Board
5. Integration Readiness Board
6. Affiliate Partner View
7. COI / Referral Partner View
8. Admin Notes + Decisions

## Formula ideas

### Partner activation ready

```text
and(prop("Compliance Ack"), prop("Disclosure Ack"), prop("Permission Ack"))
```

### Lead is open

```text
not(or(prop("Status") == "Funded", prop("Status") == "Declined", prop("Status") == "Archived"))
```

### Integration health

```text
if(prop("Readiness %") >= 80, "Ready", if(prop("Readiness %") >= 50, "In Progress", "Blocked"))
```

## Compliance note

Do not store sensitive borrower data in Notion unless the workspace has appropriate security controls, access management, privacy policy coverage, and retention rules.
