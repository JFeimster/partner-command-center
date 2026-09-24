# Partner Intake + Activation

## Role

Partner Intake + Activation is the front door of Partner Command Center.

It turns a partner signup into:

- partner profile
- partner type
- tier/path recommendation
- assigned resources
- tracking/campaign next steps
- Partner Event record
- dashboard activation state

## Source-of-truth relationship

| Repo | Role |
|---|---|
| `partner-command-center` | Live product shell, dashboard destination, module registry, and integration map. |
| `partner-intake-os` | Deeper source/reference library for intake workflow, schemas, Tally fields, classification, onboarding, GPT/action docs, and reference implementation. |

Partner Command Center should not duplicate every Partner Intake OS file. It should import the concepts that matter for the live product experience.

## Primary surfaces

- Funding Partners OS — primary partner acquisition page
- FundStack AI — ecosystem partner entry point
- Partner Command Center `partner-access.html` — temporary Tally intake bridge

## Current intake form

```text
https://tally.so/r/mOe658
```

## Current backend path

```text
Tally mOe658
→ https://partner-command-center-rho.vercel.app/api/router
→ receivePartnerSignup
→ Notion Partners DB
→ Partner Events DB
→ partner_id / activation lookup
```

## Dashboard destination

Use FPOS-style dashboard shell for Partner Command Center v2.

Initial dashboard panels:

- Partner profile
- Partner tier/path
- Assigned resources
- Tracking links
- Campaign kits
- Submitted leads
- Partner events
- Next best action

## What this module owns

- Partner signup workflow
- Partner activation state
- Partner ID / attribution spine
- Onboarding path
- Resource assignment request
- Partner dashboard activation state

## What this module does not own

- Borrower lead routing
- Funding path recommendation
- Broker follow-up queue
- COI prospecting
- Affiliate offer review

Those are separate workflow modules.

## Action/API layer

Initial action operations:

```text
classifyPartnerIntake
recommendPartnerResources
generatePartnerOnboardingPlan
generatePartnerCampaignKit
logPartnerEvent
```

## Integration notes

- Keep Tally as intake source for now.
- Use Notion as current CRM cockpit.
- Mirror to Google Sheets later.
- Do not expose the Tally webhook endpoint as a GPT Action.
- Use Bearer/API key auth for GPT-facing API calls.

## Design principle

The partner record is the operating object. Not the form submission. Not the lead. Not the dashboard card. The partner record is the spine.
