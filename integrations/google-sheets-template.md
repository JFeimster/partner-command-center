# Google Sheets Template Blueprint

Static blueprint for a Google Sheets-based operational tracker. This is useful before CRM implementation or as a lightweight export/review layer.

> Status: template blueprint only. A sheet does not replace a secure CRM, backend validation, consent capture, or audit logging.

## Workbook tabs

Recommended tabs:

```text
Partners
Leads
Lead Activity
Marketplace Offers
Resources
Training Progress
Commission Examples
Compliance Queue
Integration Readiness
Admin Notes
```

## Tab: Partners

| Column | Type | Notes |
| --- | --- | --- |
| Partner ID | Text | Example: `MS-FB-1024` |
| Status | Select | Pending, Active, Needs Review, Paused, Archived |
| Partner Type | Select | Funding Broker, Referral Partner, Affiliate Partner, COI, Operator |
| Contact Name | Text | Primary contact |
| Email | Email | Validate format |
| Phone | Text | Optional |
| Company | Text | Company or brand |
| Primary Audience | Text | Who they serve |
| Channels | Text | Comma-separated |
| Source | Text | Tally, direct, referral, affiliate, event |
| Joined At | DateTime | Submission date |
| Compliance Ack | Checkbox | Required before activation |
| Disclosure Ack | Checkbox | Required for affiliate/referral partners |
| Permission Ack | Checkbox | Required before lead submission |
| Review Notes | Text | Operator notes |

## Tab: Leads

| Column | Type | Notes |
| --- | --- | --- |
| Lead ID | Text | Unique ID |
| Partner ID | Text | Lookup to Partners |
| Business Name | Text | Required |
| Contact Name | Text | Required |
| Email | Email | Optional but recommended |
| Phone | Text | Optional |
| Industry | Text | Optional |
| Monthly Revenue Estimate | Currency | Estimate only |
| Funding Need Estimate | Currency | Estimate only |
| Use of Funds | Text | Business purpose |
| Timeline | Select | Immediate, 2 weeks, 30 days, 60–90 days, planning ahead |
| Status | Select | New, Reviewing, Needs Info, Submitted, Funded, Declined, Archived |
| Consent Confirmed | Checkbox | Required before live routing |
| Source | Text | Partner link, widget, Tally, warm intro |
| Created At | DateTime | Lead creation date |
| Updated At | DateTime | Last update |
| Next Action | Text | Operator/partner follow-up |
| Notes | Text | No sensitive data |

## Tab: Lead Activity

| Column | Type | Notes |
| --- | --- | --- |
| Event ID | Text | Unique event |
| Lead ID | Text | Related lead |
| Partner ID | Text | Related partner |
| Event Type | Select | Created, status updated, note added, document requested |
| Actor | Text | Partner/operator/system |
| Message | Text | Event summary |
| Created At | DateTime | Timestamp |

## Tab: Marketplace Offers

| Column | Type | Notes |
| --- | --- | --- |
| Offer ID | Text | Stable ID |
| Title | Text | Offer name |
| Category | Select | Funding, Education, Widget, Automation, Marketing, Integration |
| Status | Select | Draft, Demo, Approved, Needs Review, Archived |
| Allowed Partner Types | Text | Comma-separated |
| Summary | Text | Partner-facing summary |
| CTA URL | URL | Static route or future URL |
| Compliance Note | Text | Required |
| Owner | Text | Internal owner |
| Last Reviewed | Date | Review date |

## Tab: Resources

| Column | Type | Notes |
| --- | --- | --- |
| Resource ID | Text | Stable ID |
| Title | Text | Resource name |
| Type | Select | Guide, Template, Checklist, Blueprint, Tool |
| Category | Text | Resource category |
| Partner Types | Text | Who should use it |
| URL | URL | Static route |
| Featured | Checkbox | Featured card |
| Compliance Note | Text | Required |

## Tab: Compliance Queue

| Column | Type | Notes |
| --- | --- | --- |
| Flag ID | Text | Unique ID |
| Location | Text | Page, email, social draft, script |
| Phrase | Text | Flagged phrase |
| Severity | Select | Low, Medium, High |
| Rule | Text | No guarantees, privacy, disclosure, static label |
| Recommendation | Text | Safer rewrite |
| Status | Select | Open, In Review, Resolved |
| Owner | Text | Reviewer |
| Created At | DateTime | Timestamp |

## Useful formulas

### Partner lead count

```text
=COUNTIF(Leads!B:B, A2)
```

Where `A2` is the Partner ID and `Leads!B:B` is the Partner ID column.

### Open lead count

```text
=COUNTIFS(Leads!B:B, A2, Leads!L:L, "<>Funded", Leads!L:L, "<>Declined", Leads!L:L, "<>Archived")
```

### Compliance-ready partner

```text
=AND(L2=TRUE, M2=TRUE, N2=TRUE)
```

### Days since last update

```text
=TODAY()-DATEVALUE(P2)
```

## Data validation lists

Partner status:

```text
Pending, Active, Needs Review, Paused, Archived
```

Lead status:

```text
New, Reviewing, Needs Info, Submitted, Funded, Declined, Archived
```

Severity:

```text
Low, Medium, High
```

Offer status:

```text
Draft, Demo, Approved, Needs Review, Archived
```

## Production caveat

Google Sheets can be useful as a temporary operational layer, but production should move live partner/lead data to a secure database or CRM with access controls, audit logs, consent capture, and retention rules.
