# Zapier Automation Notes

Static planning notes for future Zapier automations connected to the Moonshine Partner Command Center.

> Status: blueprint only. No Zapier Zaps are live in this repo.

## Automation philosophy

Use Zapier for lightweight routing and notifications. Do not rely on Zapier as the security boundary for sensitive funding data. Production systems should still validate, authenticate, log, and store data server-side.

## Zap 1 — Tally partner signup to review queue

### Trigger

App: Tally  
Event: New Form Submission

### Filter

Continue only if:

- Email exists.
- Partner type exists.
- Agreement checkbox is true.
- Compliance acknowledgment is true.
- Permission acknowledgment is true.

### Actions

1. Formatter: normalize partner type.
2. Formatter: build partner source label.
3. CRM or Google Sheets: create/update Partner.
4. Slack or email: notify operator review queue.
5. Optional: send welcome email with static dashboard link or secure access link.

### Data to map

| Tally Field | Zapier Field |
| --- | --- |
| Full Name | `contact_name` |
| Email | `email` |
| Company | `company` |
| Partner Type | `partner_type` |
| Primary Audience | `primary_audience` |
| Channels | `channels` |
| Intended Workflow | `partner_path` |
| UTM Source | `utm_source` |
| Referral ID | `ref` |

## Zap 2 — Widget inquiry to lead queue

### Trigger

App: Webhooks by Zapier  
Event: Catch Hook

### Required incoming fields

- `partner_id`
- `business_name`
- `contact_name`
- `consent_confirmed`
- `source`

### Filter

Stop if:

- Consent is missing.
- Partner ID is missing.
- Business name is missing.
- Sensitive data is detected in free-text fields.

### Actions

1. Lookup partner by partner ID.
2. Create lead record.
3. Create activity event.
4. Notify operator.
5. Send confirmation message if allowed.

## Zap 3 — Lead status update notification

### Trigger

CRM lead status changes.

### Filter

Continue only for partner-visible statuses:

- Needs Info
- Submitted
- Funded
- Declined
- Archived

### Actions

1. Create activity event.
2. Notify partner if permitted.
3. Update partner dashboard backend record.
4. If funded, queue commission review. Do not auto-mark payable.

## Zap 4 — Compliance phrase flag

### Trigger

New content draft row or form submission.

### Logic

Search draft text for restricted phrases:

- guaranteed funding
- guaranteed approval
- everyone qualifies
- risk-free funding
- guaranteed commissions
- automatic approval
- earn guaranteed income

### Actions

1. Create compliance review record.
2. Notify operator.
3. Return recommended rewrite.
4. Block campaign approval until resolved.

## Recommended Zapier guardrails

- Use filters aggressively.
- Add delay/retry handling for CRM outages.
- Never send sensitive borrower data to channels like Slack.
- Log all automation failures.
- Keep partner notifications separate from internal operator notifications.
- Use “example only” language in any automated commission updates.
- Require human review for funded/commission milestones.

## Production requirements before activation

1. Backend endpoint for validated lead creation.
2. Webhook signature or shared secret.
3. Partner ID lookup.
4. Consent capture.
5. Restricted data detection.
6. CRM field map.
7. Operator review queue.
8. Error and retry handling.
9. Audit logging.
