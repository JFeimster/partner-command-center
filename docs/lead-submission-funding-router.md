# Lead Submission + Funding Router

## Purpose

Sprint 05 adds the first lead-side workflow after partner activation.

The system can now accept a partner-gated business lead, validate the payload, route the lead to an internal funding-fit category, and log a safe Partner Event.

This is **not** a lender submission layer. It does not produce approvals, offers, quotes, or guarantees.

## Flow

```text
Activated partner profile
  -> dashboard lead form
  -> local demo lead saved in browser
  -> lead-router intent queued locally
  -> trusted API call to /api/lead-router
  -> partner_id verified against Notion Partner record
  -> lead payload validated
  -> funding-fit route calculated
  -> Partner Event logged as lead_submitted
  -> route + next step returned
```

## Trusted endpoint

```text
POST /api/lead-router
```

Headers:

```text
Content-Type: application/json
X-API-Key: YOUR_PARTNER_COMMAND_API_KEY
```

The browser must not store or send this key. Browser dashboard actions only queue lead-router intent locally.

## Request body

```json
{
  "partner_id": "MS-P-20260707-ABC12345",
  "business_name": "Demo Main Street Services",
  "contact_name": "Casey Morgan",
  "email": "owner@example.com",
  "phone": "555-010-2424",
  "industry": "Local services",
  "monthly_revenue": 62000,
  "time_in_business": "3 years",
  "funding_need": 48000,
  "use_of_funds": "Inventory, payroll bridge, and marketing runway.",
  "urgency": "30 days",
  "source": "partner_dashboard",
  "notes": "No restricted documents collected."
}
```

## Response shape

```json
{
  "ok": true,
  "data": {
    "action": "submitLeadAndRouteFundingFit",
    "partner_id": "MS-P-20260707-ABC12345",
    "lead": {
      "business_name": "Demo Main Street Services",
      "funding_need": 48000,
      "monthly_revenue": 62000
    },
    "routing": {
      "primary_route": {
        "id": "working_capital",
        "label": "Working capital review",
        "confidence": "medium"
      },
      "flags": [],
      "next_step": "Review business fit, request missing context if needed, then decide whether to advance."
    }
  }
}
```

## Required fields

| Field | Purpose |
|---|---|
| `partner_id` | Required to prove the lead is tied to an activated partner. |
| `business_name` | Business/entity name for review. |
| `contact_name` | Contact person for follow-up. |
| `email` | Contact email. |
| `monthly_revenue` | High-level routing signal. |
| `funding_need` | High-level routing signal. |
| `use_of_funds` | Product-fit signal. |

## Rejected content

The validator rejects payloads that appear to contain:

- SSNs.
- Full tax IDs.
- Bank credentials.
- Account numbers.
- Private document references.
- Guaranteed approval/funding language.

Do not collect borrower documents in Sprint 05. Keep this layer lightweight and clean.

## Funding-fit routes

The router can return:

| Route | Use when |
|---|---|
| `working_capital` | Use of funds mentions inventory, payroll, marketing, expansion, bridge needs, or cash flow. |
| `equipment_finance` | Use of funds mentions vehicles, tools, machinery, equipment, or trucks. |
| `invoice_finance` | Use of funds mentions invoices, receivables, AR, or net terms. |
| `project_capital_review` | Use/industry suggests construction, real estate, or project-style capital. |
| `manual_review` | No clear fit or manual flags are present. |

## Flags

Potential flags include:

- `low_monthly_revenue_review`
- `early_stage_review`
- `funding_need_high_vs_revenue`
- `manual_review_signal`

Flags do not mean decline. They mean review before external action.

## Notion behavior

Sprint 05 logs a Partner Event:

```text
lead_submitted
```

The event metadata contains a safe lead summary and routing result. It does not store sensitive borrower documents or raw restricted payloads.

## Browser behavior

`scripts/live-ops.js` now listens for the dashboard lead form. When the form submits, it queues lead-router intent locally under:

```text
moonshine.partnerOS.leadRouterQueue
```

Queued records are not submissions. They are sync intent waiting for trusted server/API processing.

## Manual verification checklist

- [ ] Dashboard lead form still saves local demo leads.
- [ ] Submitting the dashboard lead form queues a lead-router intent locally.
- [ ] No API key is stored in browser JavaScript or localStorage.
- [ ] `/api/lead-router` rejects missing API key.
- [ ] `/api/lead-router` rejects missing `partner_id`.
- [ ] `/api/lead-router` rejects unknown partner IDs.
- [ ] `/api/lead-router` rejects restricted/sensitive payloads.
- [ ] Valid payload returns a funding-fit route and next step.
- [ ] Valid payload logs a `lead_submitted` Partner Event.

## Sprint 05 boundary

Sprint 05 is internal routing only. It does not submit to lenders, generate offers, create approvals, quote rates, promise commissions, or create a borrower portal.