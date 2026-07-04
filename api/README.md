# Moonshine Partner Command Center — API Example Layer

Batch 15 adds example-only API/serverless files for the future backend.

> These files are not live API routes in the current static build. They are implementation examples and contracts for a future backend/serverless layer.

## Files

```text
/api/
  README.md
  leads-submit.example.js
  lead-status.example.js
  partner-stats.example.js
  external-lead-webhook.example.js
  tally-signup-webhook.example.js
```

## Current status

The repo is static-first:

- HTML
- CSS
- Vanilla JavaScript
- Mock data
- localStorage
- Static widget
- Static admin prototype
- Integration blueprints

The `/api/*.example.js` files are intentionally named with `.example.js` so they are not confused with active production endpoints.

## Future endpoint map

| File | Future Endpoint | Purpose | Auth |
| --- | --- | --- | --- |
| `leads-submit.example.js` | `POST /api/leads-submit` | Submit a partner-attributed lead inquiry | API key / signed widget token |
| `lead-status.example.js` | `GET /api/lead-status/:lead_id` | Read partner-visible lead status | Bearer token |
| `partner-stats.example.js` | `GET /api/partner-stats` | Read partner dashboard metrics | Bearer token |
| `external-lead-webhook.example.js` | `POST /api/external-lead-webhook` | Receive external lead events | Webhook signature |
| `tally-signup-webhook.example.js` | `POST /api/tally-signup-webhook` | Receive Tally partner signup events | Webhook signature |

## Standard response envelope

Success:

```json
{
  "ok": true,
  "message": "Lead received for review. No approval, funding, terms, or timeline is guaranteed.",
  "data": {}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Consent confirmation is required.",
    "fields": ["consent.confirmed"]
  }
}
```

## Required compliance language

Every live endpoint that returns partner-facing status or lead submission messaging should preserve language like:

> Funding options may vary. Submission does not guarantee approval, funding, rates, terms, timelines, lender review, commissions, income, or any specific business outcome.

## Data that must not be collected

Do not collect or store the following through static widgets, GPT actions, partner forms, or low-trust endpoints:

- Social Security numbers
- Bank login credentials
- Full tax IDs
- Account numbers
- Private financial documents
- Full loan applications
- Sensitive borrower files
- Unverified underwriting decisions

## Production requirements before activation

Before converting these examples into live endpoints, add:

1. Backend runtime.
2. Environment-managed secrets.
3. Authentication and authorization.
4. Server-side validation.
5. Partner ID validation.
6. Consent capture.
7. Webhook signature verification.
8. Rate limiting.
9. Spam/bot protection.
10. Idempotency for webhooks.
11. Audit logs.
12. Secure database or CRM integration.
13. Error monitoring.
14. Privacy policy and terms aligned to actual data flows.
15. Operator review workflow.

## Suggested Vercel conversion

When ready to activate an endpoint in a Vercel project, copy a file like:

```text
/api/leads-submit.example.js
```

to:

```text
/api/leads-submit.js
```

Then wire the real dependencies:

- Database or CRM client
- Auth middleware
- Secret verification
- Rate limiter
- Logging
- Monitoring

Do not activate these examples as-is for production data.

## Local testing concept

If these were copied into a real serverless backend, a test request might look like:

```bash
curl -X POST "http://localhost:3000/api/leads-submit" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev-key" \
  -d '{
    "partner_id": "MS-FB-1024",
    "source": "widget",
    "business": {
      "name": "Harbor Street HVAC",
      "industry": "Contractor",
      "monthly_revenue_estimate": 78000
    },
    "contact": {
      "name": "Marcus Reed",
      "email": "marcus@example.com",
      "phone": "(555) 010-0000"
    },
    "funding": {
      "requested_amount_estimate": 85000,
      "use_of_funds": "Equipment and payroll bridge",
      "timeline": "30 days"
    },
    "consent": {
      "confirmed": true,
      "method": "widget checkbox"
    }
  }'
```

## Implementation stance

This API layer is a contract pack. It helps future builders move faster without inventing shape, copy, auth expectations, validation, and disclaimers from scratch.
