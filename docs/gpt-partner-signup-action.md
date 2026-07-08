# GPT Partner Signup Action

## Purpose

`POST /api/partner-signup` lets a Custom GPT submit a new Partner Command Center partner signup directly from chat.

This endpoint is for partner-side intake only: affiliates, referral partners, funding brokers, ISOs, consultants, CPAs/bookkeepers, real estate professionals, ecommerce consultants, creators, community connectors, vendor partners, and strategic partners.

It is not a borrower funding application endpoint.

## Tally signup vs GPT signup vs future lead submission

### Tally/default signup

The default public partner signup form continues to flow through Tally and the unified router:

```text
POST /api/router
Action: receivePartnerSignup
```

Use this when the partner signs up from the default form or a Tally webhook submits the partner record.

### GPT signup

The GPT Action partner signup flow uses a dedicated flat Vercel API file:

```text
POST /api/partner-signup
Operation: submitPartnerSignup
```

Use this when a Custom GPT collects partner profile context and submits it to Partner Command Center.

### Future lead submission

Future funding lead submission stays downstream of partner activation. It must remain separate from partner signup.

A partner signs up first. After activation, partner-attributed leads can flow through the downstream lead route.

## Endpoint map

```text
api/router.js         -> POST /api/router         -> Tally/default partner signup router using receivePartnerSignup
api/partner-signup.js -> POST /api/partner-signup -> GPT Action partner signup endpoint
api/lead-router.js    -> POST /api/lead-router    -> downstream partner-attributed funding leads, not partner signup
```

## Required environment variables

```text
PARTNER_COMMAND_API_KEY
NOTION_API_KEY
NOTION_PARTNERS_DB_ID
NOTION_PARTNER_EVENTS_DB_ID
NOTION_PARTNER_RESOURCES_DB_ID
NOTION_TRACKING_LINKS_DB_ID
```

Keep these server-side. Do not expose Notion tokens or the partner command API key in browser JavaScript.

## Example curl request using Bearer auth

```bash
curl -X POST "https://partner-command-center-rho.vercel.app/api/partner-signup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PARTNER_COMMAND_API_KEY" \
  -d '{
    "partner": {
      "first_name": "Alex",
      "last_name": "Rivera",
      "email": "alex@example.com",
      "phone": "+1-555-010-1000",
      "company": "Rivera Growth Media",
      "website": "https://example.com",
      "partner_type_claimed": "creator_affiliate",
      "audience": "small business owners, freelancers, and startup operators",
      "industry": "content, media, and business education",
      "location": "Washington, DC",
      "funding_experience": "Some experience referring business owners to funding resources.",
      "current_tools": "Newsletter, YouTube, Substack, CRM, affiliate links",
      "traffic_or_network_size": "5,000 email subscribers and 12,000 social followers",
      "referral_volume_estimate": "5 to 10 warm referrals per month",
      "desired_partner_role": "Promote funding readiness resources and refer qualified business owners",
      "notes": "Interested in affiliate tracking, compliant content angles, and onboarding resources.",
      "source": "gpt_action"
    }
  }'
```

## Example curl request using X-API-Key auth

```bash
curl -X POST "https://partner-command-center-rho.vercel.app/api/partner-signup" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $PARTNER_COMMAND_API_KEY" \
  -d '{
    "partner": {
      "first_name": "Morgan",
      "last_name": "Lee",
      "email": "morgan@example.com",
      "company": "Lee Capital Referrals",
      "partner_type_claimed": "funding_broker",
      "audience": "small business owners and operators",
      "industry": "commercial finance",
      "funding_experience": "Experienced funding broker with active client conversations.",
      "current_tools": "CRM, email outreach, referral forms, partner links",
      "referral_volume_estimate": "10 to 20 qualified referrals per month",
      "desired_partner_role": "Refer qualified business owners and use partner tracking links",
      "notes": "Ready to launch this month and wants broker onboarding resources.",
      "source": "gpt_action"
    }
  }'
```

## GPT Action setup notes

Use this OpenAPI file in the GPT Action builder:

```text
integrations/openapi.partner-signup.json
```

Set authentication to Bearer token and use the value of:

```text
PARTNER_COMMAND_API_KEY
```

The GPT Action should call:

```text
https://partner-command-center-rho.vercel.app/api/partner-signup
```

The request body should use the nested `partner` object. The endpoint also accepts the partner object directly at the top level for convenience, but the GPT Action schema should use the documented nested shape.

Minimum required field:

```text
email
```

Preferred partner fields:

```text
first_name
last_name
company
phone
website
partner_type_claimed
audience
industry
location
funding_experience
current_tools
traffic_or_network_size
referral_volume_estimate
desired_partner_role
notes
source
```

## Safety note

Do not collect borrower funding application data in this action.

Do not send SSNs, tax IDs, bank credentials, routing numbers, account numbers, bank statements, tax returns, credit reports, private borrower documents, or full loan applications through `/api/partner-signup`.

If that kind of data appears, the endpoint should reject the payload. Partner signup is for partner profile, classification, onboarding path, and resource assignment only. The lending-adjacent stuff stays in the proper downstream lane — not in the partner signup kitchen sink.

## Manual verification checklist

- [ ] Confirm `PARTNER_COMMAND_API_KEY` is set in Vercel.
- [ ] Confirm Notion environment variables are set in Vercel.
- [ ] Confirm the Notion integration has access to Partners, Partner Events, Partner Resources, and Tracking Links databases.
- [ ] Import `integrations/openapi.partner-signup.json` into the GPT Action builder.
- [ ] Configure GPT Action authentication as Bearer token.
- [ ] Test a creator/affiliate signup.
- [ ] Test a funding broker signup.
- [ ] Test a referral partner signup.
- [ ] Test missing email returns a validation error.
- [ ] Test borrower/funding application fields are rejected.
- [ ] Test sensitive data in notes is rejected.
- [ ] Confirm a Partner record is created or updated in Notion.
- [ ] Confirm a Partner Event is created with `partner_signup_created` or `partner_signup_updated`.
- [ ] Confirm `/api/router` still receives Tally/default partner signup traffic.
- [ ] Confirm `/api/lead-router` remains downstream and is not used for partner signup.
