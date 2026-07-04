# Tally Partner Signup Integration Blueprint

Static integration blueprint for routing Moonshine Partner Command Center signups from Tally into the future partner onboarding system.

> Status: blueprint only. This file does not create a live webhook, CRM record, partner account, or approval workflow.

## Primary use case

Partners currently sign up through Tally. After submission, the intended production flow is:

```text
Tally form submission
→ Tally webhook
→ backend validation
→ partner profile created or queued for review
→ CRM/contact record created
→ welcome/dashboard access link generated
→ operator review if needed
```

## Recommended Tally fields

| Tally Field | Internal Field | Required | Notes |
| --- | --- | --- | --- |
| Full Name | `contact_name` | Yes | Partner contact name |
| Email | `email` | Yes | Must be valid email |
| Phone | `phone` | No | Optional |
| Company / Brand | `company` | Yes | Partner business name |
| Partner Type | `partner_type` | Yes | Funding broker, referral partner, affiliate partner, COI, operator |
| Primary Audience | `primary_audience` | Yes | Who they serve or reach |
| Channels | `channels` | No | Outreach channels |
| Website / Social URL | `website_url` | No | Helps partner review |
| Referral Source | `source` | No | Where signup came from |
| Intended Workflow | `partner_path` | Yes | Submit leads, make intros, promote links, client readiness, ops review |
| Agreement Checkbox | `agreement_acknowledged` | Yes | Must be true |
| Compliance Checkbox | `compliance_acknowledged` | Yes | Must be true |
| Permission-Based Referral Checkbox | `permission_acknowledged` | Yes | Must be true |

## Recommended hidden fields

Use hidden fields in Tally URLs when possible:

| Hidden Field | Example | Purpose |
| --- | --- | --- |
| `partner_source` | `homepage` | Source route |
| `utm_source` | `linkedin` | Campaign source |
| `utm_medium` | `social` | Campaign medium |
| `utm_campaign` | `partner_launch` | Campaign |
| `ref` | `MS-AF-2048` | Referrer/affiliate |
| `landing_page` | `/partner-access.html` | Entry page |

## Redirect after signup

Recommended redirect target:

```text
https://YOUR-DOMAIN.com/welcome/index.html?signup=tally&status=submitted
```

For the current static site, use:

```text
./welcome/index.html?signup=tally&status=submitted
```

The static welcome page can show a generic message, but production should only show partner-specific content after authentication or a secure token.

## Webhook payload shape

Example Tally webhook payload normalized into backend format:

```json
{
  "event_type": "partner.signup.created",
  "source": "tally",
  "submitted_at": "2026-07-04T12:00:00Z",
  "form_id": "FORM_ID",
  "submission_id": "SUBMISSION_ID",
  "partner": {
    "contact_name": "Jordan Ellis",
    "email": "jordan@example.com",
    "phone": "(555) 010-1024",
    "company": "Marcus Funding Desk",
    "partner_type": "funding-broker",
    "partner_path": "submit-leads",
    "primary_audience": "Contractors and local service businesses",
    "channels": ["direct-outreach", "referrals"]
  },
  "acknowledgments": {
    "agreement_acknowledged": true,
    "compliance_acknowledged": true,
    "permission_acknowledged": true
  },
  "attribution": {
    "utm_source": "linkedin",
    "utm_medium": "social",
    "utm_campaign": "partner_launch",
    "ref": "MS-AF-2048"
  }
}
```

## Validation rules

Reject or queue for review when:

- Email is missing or invalid.
- Partner type is missing.
- Required acknowledgments are false.
- Submission includes restricted claims such as “guaranteed funding” or “guaranteed commissions.”
- Partner website/content appears to promise approval, rates, terms, timelines, or income.
- Form includes sensitive borrower data that should not be collected in signup.

## Partner status mapping

| Condition | Partner Status |
| --- | --- |
| Required fields complete and low-risk | `pending-review` |
| Known/trusted existing partner | `active` |
| Missing fields | `needs-info` |
| Risky copy or compliance concern | `needs-review` |
| Spam or abuse | `rejected` |

## Operator review checklist

- Confirm partner identity and business context.
- Confirm partner type and intended workflow.
- Confirm no prohibited claims in application notes.
- Confirm affiliate/referral disclosure requirements.
- Confirm partner ID generation.
- Confirm whether partner should get dashboard access, resources only, or manual review.

## Production requirements

1. HTTPS webhook endpoint.
2. Signature verification if supported.
3. Server-side validation.
4. Spam protection.
5. Idempotency using submission ID.
6. CRM/database create-or-update logic.
7. Audit log.
8. Welcome/access token generation.
9. Operator review queue.
10. Production privacy and terms alignment.

## Compliance note

Partner signup does not guarantee approval into a program, commission eligibility, funding outcomes, deal flow, or revenue.
