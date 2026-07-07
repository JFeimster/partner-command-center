# Tally Intake Fields

## Purpose

Define the live Partner Command Center Tally signup fields for Sprint 02.

This form collects partner identity and activation context. It does not collect borrower lead or underwriting data.

## Recommended form name

```text
Moonshine Capital Partner Signup
```

## Recommended webhook event

```text
FORM_RESPONSE
```

## Required fields

| Section | Tally label | Internal field | Type | Required | Notes |
|---|---|---|---|---:|---|
| Contact | First name | `first_name` | Short answer | Yes | Primary contact first name. |
| Contact | Last name | `last_name` | Short answer | Yes | Primary contact last name. |
| Contact | Email | `email` | Email | Yes | Required for lookup and follow-up. |
| Partner type | Which best describes you? | `partner_type_claimed` | Dropdown | Yes | Use options below. |
| Audience | Who do you serve? | `audience` | Long answer | Yes | Core classification signal. |
| Goals | What partner role are you most interested in? | `desired_partner_role` | Multiple choice | Yes | Helps select onboarding path. |
| Consent | Partner acknowledgment | `partner_acknowledgment` | Checkbox | Yes | Compliance acknowledgment. |
| Consent | Contact permission | `contact_permission` | Checkbox | Yes | Permission for onboarding contact. |

## Optional fields

| Section | Tally label | Internal field | Type | Notes |
|---|---|---|---|---|
| Contact | Phone | `phone` | Phone | Useful for high-fit partner follow-up. |
| Business | Company / brand | `company` | Short answer | Company, agency, org, or creator brand. |
| Business | Website or profile URL | `website` | Website | Website, LinkedIn, community, profile, or landing page. |
| Partner type | Are you applying as an individual, company, or organization? | `applicant_entity_type` | Multiple choice | Individual, company/agency, nonprofit/community org, vendor/platform, other. |
| Audience | What industries do you usually work with? | `industry` | Short answer | Contractors, ecommerce, real estate, trucking, professional services, etc. |
| Audience | Approximate audience, client, or network size | `traffic_or_network_size` | Multiple choice | Use ranges, not fake precision. |
| Experience | Do you currently refer business funding deals? | `currently_refers_funding` | Multiple choice | Regularly, sometimes, rarely, interested, N/A. |
| Experience | Describe your funding, finance, or referral experience | `funding_experience` | Long answer | Useful for classification and review. |
| Experience | Estimated monthly referral volume | `referral_volume_estimate` | Multiple choice | 0, 1-2, 3-5, 6-10, 11-25, 26+, not sure. |
| Process | How do you currently send or manage referrals? | `referral_process` | Long answer | Useful for future workflow setup. |
| Tools | What tools do you currently use? | `current_tools` | Checkbox | HubSpot, GoHighLevel, Salesforce, Notion, Sheets, Airtable, Zapier, n8n, etc. |
| Tools | If you selected Other tools, list them here | `current_tools_other` | Short answer | Append context only. |
| Goals | What would make this partnership successful for you? | `success_goal` | Long answer | Good onboarding context. |
| Goals | How quickly are you hoping to launch? | `launch_timeline` | Multiple choice | Immediately, this week, this month, next quarter, exploring. |
| Notes | Anything else we should know? | `notes` | Long answer | Screen for restricted or risky content before storing. |
| Notes | Best next step | `preferred_next_step` | Multiple choice | Send resources, schedule call, review fit, help launch campaign, not sure. |

## Partner type options

```text
Funding broker
ISO
Referral partner
CPA / bookkeeper
Small business attorney
Business broker
Real estate professional
Ecommerce consultant
Business consultant
Veteran community connector
Creator / affiliate
Fintech / vendor partner
Strategic partner
Other
Not sure yet
```

## Desired partner role options

```text
Affiliate partner
Referral partner
Broker / funding advisor
Strategic channel partner
Education / community partner
Vendor / integration partner
Not sure yet
```

## Consent copy

### Partner acknowledgment

```text
I understand that Moonshine Capital reviews partner fit and does not guarantee funding approvals, funding amounts, lender matches, business credit results, or partner revenue.
```

### Contact permission

```text
I agree to be contacted about partner onboarding, resources, and next steps.
```

## Thank-you message

```text
Thanks for your interest in partnering with Moonshine Capital. We review partner fit, audience alignment, and next steps before sending onboarding resources. No funding outcome is guaranteed, and partner resources are intended for educational and operational use.
```

## Data boundary

Do not request personal identifiers, financial-account access details, private documents, borrower financial files, underwriting decisions, or funding approval promises.

## Sprint 02 router behavior

The router maps these fields, classifies the partner, assigns onboarding/resource/campaign recommendations, creates or updates the Notion Partner record, logs an event, and returns `partner_id`.

Lead submission is not part of this form.