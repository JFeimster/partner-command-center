# Lead Submission + Funding Router

## Role

Lead Router turns partner-submitted borrower opportunities into structured funding review records.

It is the first high-commercial-value downstream workflow after partner activation.

## Primary surfaces

- Am I Fundable — borrower readiness scorecard / lead magnet
- BrokerFlow AI — broker-facing intake and follow-up surface
- Partner Command Center dashboard — partner lead submission and admin review queue

## Workflow

```text
Borrower scorecard or partner lead form
→ Lead Router workflow
→ partner attribution
→ readiness score
→ funding path recommendation
→ document checklist
→ routing decision
→ admin review queue
→ partner lead status
```

## Core output

- lead_id
- partner_id
- borrower/business snapshot
- requested amount
- use of funds
- urgency
- revenue / time in business / credit range
- readiness score
- likely funding path
- missing information
- document checklist
- routing status
- next action

## Dashboard destination

Use FPOS pipeline/grid pattern for:

- new leads
- needs info
- ready for review
- manual review
- documents requested
- submitted
- funded
- lost

## Recommended first integration

```text
Am I Fundable
→ add partner_id / source / campaign fields
→ post or export into Lead Router
→ display in Partner Command Center lead queue
```

## Action/API layer

Initial operations:

```text
submitLead
classifyLead
recommendFundingPath
generateDocumentChecklist
getLeadStatus
addLeadNote
```

## Safety boundary

This is a routing/readiness workflow. It does not approve, decline, guarantee, underwrite, or quote terms unless terms are provided by an approved source.
