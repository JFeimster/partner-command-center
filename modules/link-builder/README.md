# Partner Tracking Link Builder

## Role

Partner Tracking Link Builder turns partner identity and campaign intent into trackable referral links, UTM strings, campaign records, and partner-ready promotion assets.

## Primary surfaces

- FPOS marketing kits — dashboard-side link/widget builder pattern
- PartnerLaunch — later widget suite and co-branded launch assets
- Funding Partners OS — acquisition/campaign language source

## Workflow

```text
Partner ID + campaign goal
→ tracking link request
→ UTM/campaign fields
→ tracking URL / short URL
→ campaign copy
→ dashboard record
→ event log
```

## Core output

- tracking_link_id
- partner_id
- campaign_id
- destination_url
- tracking_url
- short_url
- utm_source
- utm_medium
- utm_campaign
- utm_content
- affiliate_code
- campaign status

## Dashboard destination

Use FPOS marketing kit/widget pattern for:

- create link
- copy link
- create campaign
- preview CTA
- generate widget/embed snippet
- view partner links

## Action/API layer

Initial operations:

```text
createTrackingLink
createCampaign
getPartnerLinks
recommendCampaignKit
logTrackingEvent
```

## Integration notes

- Source of truth may be Notion Tracking Links at first.
- Google Sheets Tracking Links tab can mirror records later.
- Click tracking can remain planned until the router/storage layer is ready.
