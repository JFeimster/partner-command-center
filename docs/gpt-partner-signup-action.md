# GPT Partner Signup Action

## Purpose

`POST /api/partner-signup` lets a Custom GPT submit a new Partner Command Center partner signup directly from chat.

This endpoint is for partner-side signup only: affiliates, referral partners, funding brokers, ISOs, consultants, CPAs/bookkeepers, real estate professionals, ecommerce consultants, creators, community connectors, vendor partners, channel partners, and strategic partners.

It is **not** a borrower funding application endpoint.

## Endpoint

```text
POST https://partner-command-center-rho.vercel.app/api/partner-signup
```

Operation:

```text
submitPartnerSignup
```

Implementation file:

```text
api/partner-signup.js
```

OpenAPI file for GPT Builder:

```text
integrations/openapi.partner-signup.json
```

## Authentication

Set GPT Builder authentication to:

```text
Authentication: API Key
Auth Type: Bearer
Secret: PARTNER_COMMAND_API_KEY
```

The GPT Action request should send:

```text
Authorization: Bearer <PARTNER_COMMAND_API_KEY>
```

The endpoint also accepts trusted manual/server tests with:

```text
X-API-Key: <PARTNER_COMMAND_API_KEY>
```

Keep the key inside GPT Action authentication only. Do not paste it into instructions, knowledge files, examples, screenshots, or public docs.

## Tally signup vs GPT signup vs funding lead submission

### Tally/default signup

The default public signup form can continue through Tally and the unified router:

```text
POST /api/router
Action: receivePartnerSignup
```

Use this for default form ingestion and Tally webhook-style submissions.

### GPT signup

The GPT Action partner signup flow uses:

```text
POST /api/partner-signup
Operation: submitPartnerSignup
```

Use this when a Custom GPT collects partner profile context and submits it to Partner Command Center.

### Funding lead submission

Funding lead submission remains downstream of partner activation and must stay separate.

```text
POST /api/lead-router
```

Do not use `/api/lead-router` for partner signup. Do not use `/api/partner-signup` for borrower funding applications.

## Endpoint map

```text
api/router.js         -> POST /api/router         -> Tally/default partner signup router using receivePartnerSignup
api/partner-signup.js -> POST /api/partner-signup -> GPT Action partner signup endpoint
api/partner-links.js  -> POST /api/partner-links  -> trusted partner tracking-link creation
api/lead-router.js    -> POST /api/lead-router    -> downstream partner-attributed funding leads only
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

## Required and preferred fields

Minimum required field:

```text
email
```

Preferred fields:

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

Use `source: gpt_action` for ChatGPT submissions.

## Nested request shape

The GPT Action should use the nested `partner` object:

```json
{
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
    "source": "gpt_action"
  }
}
```

The endpoint accepts a top-level partner object too, but the GPT Action schema should keep the nested shape.

## Partner classification outputs

The endpoint classifies partner profile context into:

```text
funding_broker
referral_partner
affiliate_partner
center_of_influence
professional_service_provider
community_connector
internal_operator
unknown
```

It also returns:

```text
partner_id
status
tier
onboarding_path
resource_recommendations
campaign_recommendations
```

## Bearer-auth curl test

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
      "funding_experience": "Some experience referring business owners to funding resources.",
      "current_tools": "Newsletter, YouTube, Substack, CRM, affiliate links",
      "traffic_or_network_size": "5,000 email subscribers and 12,000 social followers",
      "referral_volume_estimate": "5 to 10 warm referrals per month",
      "desired_partner_role": "Promote funding readiness resources and refer qualified business owners",
      "source": "gpt_action"
    }
  }'
```

## X-API-Key curl test

```bash
curl -X POST "https://partner-command-center-rho.vercel.app/api/partner-signup" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $PARTNER_COMMAND_API_KEY" \
  -d '{
    "partner": {
      "first_name": "Taylor",
      "last_name": "Nguyen",
      "email": "taylor@example.com",
      "company": "Nguyen Business Services",
      "partner_type_claimed": "referral_partner",
      "audience": "local service businesses and independent operators",
      "industry": "business consulting",
      "funding_experience": "Occasionally refers clients to trusted finance contacts.",
      "current_tools": "Email, LinkedIn, spreadsheet tracker",
      "referral_volume_estimate": "1 to 3 warm referrals per month",
      "desired_partner_role": "Make warm introductions when clients need funding readiness support",
      "source": "gpt_action"
    }
  }'
```

## Safety boundary

Do not collect borrower funding application data in this action.

Do not send:

```text
SSNs
tax IDs
bank credentials
routing numbers
account numbers
bank statements
tax returns
credit reports
private borrower documents
full loan applications
requested funding amount
monthly borrower revenue
borrower credit score
borrower funding purpose
```

If that kind of data appears, the GPT should not call the action. If it reaches the endpoint, the endpoint should reject the payload.

Partner signup is for partner profile, classification, onboarding path, and resource assignment only.

## GPT Action setup notes

1. Open GPT Builder.
2. Add an action.
3. Import `integrations/openapi.partner-signup.json`.
4. Configure authentication as API Key / Bearer.
5. Use the value from `PARTNER_COMMAND_API_KEY` as the secret.
6. Test `submitPartnerSignup` with a creator, funding broker, and referral partner payload.
7. Confirm Partner and Partner Event records appear in Notion.

## Manual verification checklist

```text
[ ] Confirm PARTNER_COMMAND_API_KEY is set in GPT Action authentication.
[ ] Confirm Notion environment variables are set in Vercel.
[ ] Confirm the Notion integration has access to Partners, Partner Events, Partner Resources, and Tracking Links databases.
[ ] Import integrations/openapi.partner-signup.json into GPT Builder.
[ ] Configure GPT Action authentication as API Key / Bearer token.
[ ] Test a funding broker signup.
[ ] Test an affiliate partner signup.
[ ] Test a referral partner signup.
[ ] Test missing email returns a validation error.
[ ] Test borrower/funding application fields are rejected.
[ ] Test sensitive data in notes is rejected.
[ ] Confirm a Partner record is created or updated in Notion.
[ ] Confirm a Partner Event is created with partner_signup_created or partner_signup_updated.
[ ] Confirm /api/router still receives Tally/default partner signup traffic.
[ ] Confirm /api/lead-router remains downstream and is not used for partner signup.
```
