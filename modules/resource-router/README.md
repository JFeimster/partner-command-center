# Resource Router

## Role

Resource Router recommends the next useful resource, tool, lead magnet, GPT, article, checklist, calculator, or campaign asset based on partner type, funnel stage, and current workflow need.

## Primary surfaces

- FundStack AI — ecosystem hub and tool/resource library
- Partner Command Center dashboard — Resource Hub module
- Partner Intake — initial resource assignment trigger

## Workflow

```text
Partner profile or workflow state
→ resource recommendation rules
→ assigned resources
→ dashboard resource card
→ event log
→ optional campaign/action CTA
```

## Core output

- resource_id
- partner_id
- recommended_resource
- reason
- funnel_stage
- partner_type_fit
- CTA
- follow-up asset
- assigned_at
- status

## Dashboard destination

Use FPOS-style card layout for:

- recommended resources
- training assets
- campaign kits
- lead magnets
- recently assigned resources
- completed/viewed state

## Action/API layer

Initial operations:

```text
recommendPartnerResources
assignPartnerResource
getPartnerResources
trackResourceClick
logResourceEvent
```

## Integration notes

- FundStack AI should remain the public resource hub.
- Partner Command Center should show the assigned/next-best resources.
- Notion Partner Resources is the current backend candidate.
- Google Sheets Partner Resources tab can mirror later.
