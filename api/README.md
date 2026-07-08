# Moonshine Partner Command Center — API Layer

Partner Command Center is static-first on the front end, but this repo now includes flat Vercel-style API routes under `/api/` for live partner workflows.

## Active API routes

```text
api/router.js -> POST /api/router
api/partner-links.js -> POST /api/partner-links
api/lead-router.js -> POST /api/lead-router
api/partner-signup.js -> POST /api/partner-signup
```

Route roles:

- `/api/router` remains the Tally/default partner signup router. Use `receivePartnerSignup` for default form ingestion.
- `/api/partner-signup` is the GPT Action partner signup endpoint for partners, affiliates, referral partners, brokers, creators, consultants, and other partner-side signups.
- `/api/partner-links` creates trusted partner tracking links after a partner exists.
- `/api/lead-router` is for downstream partner-attributed funding leads, not partner signup.

## Legacy example files

Batch 15 added example-only API/serverless files for future backend contracts.

```text
/api/
  README.md
  leads-submit.example.js
  lead-status.example.js
  partner-stats.example.js
  external-lead-webhook.example.js
  tally-signup-webhook.example.js
```

The `/api/*.example.js` files are intentionally named with `.example.js` so they are not confused with active production endpoints.

## Current implementation stance

The repo remains static-first where appropriate:

- HTML
- CSS
- Vanilla JavaScript
- Mock data
- localStorage
- Static widget
- Static admin prototype
- Integration blueprints

Live API files must keep secrets server-side and should use the shared helper layer in `/lib/`.

## Future endpoint map from the original contract pack

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
  "data": {}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "Validation failed.",
    "details": {}
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

Before converting examples into live endpoints, add or confirm:

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

## Suggested Vercel conversion for example files

When ready to activate an example endpoint in a Vercel project, copy a file like:

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

Do not activate example files as-is for production data.

## Local testing concept

A live API route can be syntax-checked locally with Node before deployment:

```bash
node -c api/partner-signup.js
```

A deployed route can be tested with:

```bash
curl -X POST "https://partner-command-center-rho.vercel.app/api/partner-signup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PARTNER_COMMAND_API_KEY" \
  -d '{
    "partner": {
      "first_name": "Alex",
      "last_name": "Rivera",
      "email": "alex@example.com",
      "company": "Rivera Growth Media",
      "partner_type_claimed": "creator_affiliate",
      "audience": "small business owners, freelancers, and startup operators",
      "source": "gpt_action"
    }
  }'
```
