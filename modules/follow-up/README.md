# Broker Follow-Up Queue

## Role

Broker Follow-Up Queue turns stalled borrower/lead situations into clear next-touch workflows.

This module is for missing docs, stalled deals, declined leads, renewal opportunities, referral nurture, and dead-lead revival.

## Primary surfaces

- BrokerFlow AI — broker automation / follow-up landing page
- Partner Command Center dashboard — follow-up queue module
- Lead Router — source of lead status and missing-doc triggers

## Workflow

```text
Lead status or broker note
→ Follow-Up workflow
→ suggested message / script / CRM note
→ human review
→ task or draft message
→ event log
```

## Core output

- follow_up_item_id
- lead_id
- partner_id
- reason
- channel
- suggested message
- call script
- voicemail script
- CRM note
- next touch date
- priority
- approval state

## Dashboard destination

Use FPOS-style queue cards grouped by:

- missing docs
- stalled review
- no response
- declined/reactivation
- renewal
- referral nurture

## Action/API layer

Initial operations:

```text
generateFollowUp
generateMissingDocsMessage
generateDeadLeadRevival
logFollowUpNote
createFollowUpTask
```

## Safety boundary

Messages should be useful and commercial, but not promise approval, funding, terms, or guaranteed results. Human approval should stay in the loop before sending automated borrower-facing messages.
