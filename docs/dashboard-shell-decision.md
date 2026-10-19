# Dashboard Shell Decision

## Decision

Use the FPOS dashboard pattern as the preferred Partner Command Center dashboard v2 shell.

Do not continue trying to polish the current weak static dashboard into the full product surface unless a specific page already supports a real workflow.

## Why FPOS wins

FPOS already has the useful operating pattern:

- persistent sidebar
- overview hub
- metric cards
- pipeline grid
- drag/drop workflow cards
- marketing kits
- configuration panel
- localStorage persistence
- operator profile settings
- widget embed builder
- dark fintech command-center style

That is closer to the product Partner Command Center should become.

## Dashboard v2 objective

Turn Partner Command Center into a workflow surface, not a static brochure.

```text
Partner signs up
→ gets classified/tiered
→ receives resources and campaign kits
→ creates links
→ submits leads
→ tracks status
→ gets follow-up prompts
→ operators see review queues and activity
```

## Recommended navigation

```text
Overview
Partner Intake
Lead Router
Partner Links
Campaign Kits
Resources
Follow-Up Queue
COI Pipeline
Affiliate Offers
Funding Readiness
Operator Queue
Settings
```

## Object model shift

FPOS currently treats items as deal/client files. Partner Command Center should normalize this into workflow objects.

| FPOS concept | Partner Command Center concept |
|---|---|
| Deal file | Lead, partner event, or workflow item |
| Pipeline stage | Workflow status |
| Marketing kit | Campaign kit / partner asset |
| Agent code | Partner ID / referral code |
| Widget config | Partner tracking widget / campaign embed |
| Projected commissions | Partner revenue / opportunity metrics |

## First dashboard v2 pass

Replace the FPOS demo data model with these objects:

```text
partners
leads
tracking_links
resources
campaign_kits
follow_up_items
operator_tasks
partner_events
```

## Initial localStorage namespaces

```text
pcc.partners
pcc.leads
pcc.trackingLinks
pcc.resources
pcc.campaignKits
pcc.followUpItems
pcc.operatorTasks
pcc.partnerEvents
pcc.config
```

## What should stay static for now

- dashboard shell
- sample module cards
- sample workflow data
- localStorage persistence
- import/export JSON
- module registry

## What should connect later

- Tally webhook records
- Notion Partner CRM
- Google Sheets mirror
- GPT Actions
- real API router
- partner authentication
- role-based lead visibility

## Current priority

1. Keep Funding Partners OS as partner acquisition page.
2. Use FPOS shell as dashboard v2 reference.
3. Use Am I Fundable as the first borrower/Lead Router feeder.
4. Keep Partner Command Center as the central workflow registry and dashboard surface.
