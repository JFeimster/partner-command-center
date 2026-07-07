# Tally Field Map

## Purpose

Map Tally partner signup fields into the normalized Partner Command Center partner object consumed by `/api/router.js`.

The field labels below are supported by the Sprint 02 router. Keep labels stable once the form is live. Renaming fields after launch is how clean data turns into soup with receipts.

## Required field map

| Tally label | Router field | Required | Notes |
|---|---|---:|---|
| First name | `first_name` | Yes | Combined with last name into `name`. |
| Last name | `last_name` | Yes | Combined with first name into `name`. |
| Email | `email` | Yes | Primary lookup and contact field. |
| Phone | `phone` | No | Optional follow-up field. |
| Company / brand | `company` | No | Company, agency, creator brand, firm, or organization. |
| Website or profile URL | `website` | No | Website, LinkedIn, community, or public profile. |
| Which best describes you? | `partner_type_claimed` | Yes | Used as classification signal, not blindly trusted as final type. |
| Are you applying as an individual, company, or organization? | `applicant_entity_type` | No | Stored as raw field context for later review. |
| Who do you serve? | `audience` | Yes | Required activation signal. |
| What industries do you usually work with? | `industry` | No | Classification and resource signal. |
| Approximate audience, client, or network size | `traffic_or_network_size` | No | Tier signal only; not verified. |
| Do you currently refer business funding deals? | `currently_refers_funding` | No | Tier/onboarding signal. |
| Describe your funding, finance, or referral experience | `funding_experience` | No | Classification and review signal. |
| Estimated monthly referral volume | `referral_volume_estimate` | No | Tier signal only; not verified. |
| How do you currently send or manage referrals? | `referral_process` | No | Future onboarding/workflow signal. |
| What tools do you currently use? | `current_tools` | No | Future integration/workflow signal. |
| If you selected Other tools, list them here | `current_tools_other` | No | Append context only. |
| What partner role are you most interested in? | `desired_partner_role` | Yes | Classification and onboarding signal. |
| What would make this partnership successful for you? | `success_goal` | No | Review/onboarding context. |
| How quickly are you hoping to launch? | `launch_timeline` | No | Activation speed signal. |
| Anything else we should know? | `notes` | No | Screen for sensitive/risky content before storage. |
| Best next step | `preferred_next_step` | No | Next-action signal. |
| Partner acknowledgment | `partner_acknowledgment` | Yes | Compliance acknowledgement. |
| Contact permission | `contact_permission` | Yes | Consent to be contacted about onboarding. |

## Normalized Partner fields created by the router

The router creates or assigns:

| Normalized field | Source |
|---|---|
| `partner_id` | Existing payload value or generated as `MS-P-{timestamp/hash}`. |
| `name` | First name + last name, fallback to company/email. |
| `email` | Tally Email. |
| `phone` | Tally Phone. |
| `company` | Tally Company / brand. |
| `website` | Tally Website or profile URL. |
| `partner_type` | Router classification result. |
| `audience` | Tally Who do you serve? |
| `referral_source` | Defaults to `tally_partner_signup`. |
| `traffic_source` | Defaults to `tally`. |
| `status` | `intake_received` or `needs_review`. |
| `tier` | Rules-based tier recommendation. |
| `onboarding_path` | Rules-based onboarding path. |
| `resource_recommendations` | Rules-based resource recommendations. |
| `campaign_recommendations` | Rules-based campaign recommendations. |
| `tally_submission_id` | Tally response/submission ID if present. |
| `created_at` | Tally submission time or router timestamp. |
| `updated_at` | Router timestamp. |

## Field hygiene rules

- Keep Tally labels human-readable.
- Prefer dropdowns/multiple choice for classification fields.
- Do not request borrower underwriting data.
- Do not request SSNs, full tax IDs, bank credentials, account numbers, private documents, or borrower financial docs.
- Do not imply guaranteed funding, guaranteed approval, guaranteed revenue, or credit repair outcomes.
- Preserve consent/acknowledgment fields.

## Hidden fields recommended later

These are optional but useful when Tally links are campaign-specific:

| Hidden field | Purpose |
|---|---|
| `referral_source` | Source partner, campaign, or referrer. |
| `traffic_source` | Organic, paid, email, partner, event, etc. |
| `utm_source` | Future tracking link/source attribution. |
| `utm_medium` | Future campaign medium. |
| `utm_campaign` | Future campaign name. |
| `landing_page` | Entry page before signup. |

Sprint 02 does not require hidden fields, but the router can accept direct values if they are present in the payload.