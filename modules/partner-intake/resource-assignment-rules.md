# Resource Assignment Rules

## Purpose

Define starter resources and campaign recommendations assigned during Sprint 02 partner signup processing.

These resources are stored as labels on the Partner record now and can become full Partner Resource records through the `assignPartnerResources` router action.

## Base resources

Every valid partner receives:

```text
Partner Program Overview
Compliance-Safe Referral Rules
```

## Path-based resource rules

| Onboarding path | Resource recommendations |
|---|---|
| `broker_fast_start` | Partner Program Overview; Compliance-Safe Referral Rules; Broker Fast Start Checklist; Deal Handoff Playbook; Partner Link Setup Guide |
| `affiliate_launch_path` | Partner Program Overview; Compliance-Safe Referral Rules; Affiliate Launch Kit; Campaign Swipe File; Tracking Link Setup Guide |
| `coi_relationship_path` | Partner Program Overview; Compliance-Safe Referral Rules; COI Referral Intro Script; Relationship-Based Referral Guide |
| `referral_partner_path` | Partner Program Overview; Compliance-Safe Referral Rules; Referral Partner Quickstart; Warm Intro Script |
| `manual_review_path` | Partner Program Overview; Manual Review Next Steps; Compliance-Safe Referral Rules |

## Campaign recommendation rules

| Onboarding path | Campaign recommendation |
|---|---|
| `broker_fast_start` | Broker Deal Flow Reactivation |
| `affiliate_launch_path` | Affiliate Partner Launch Campaign |
| `coi_relationship_path` | Trusted Advisor Intro Campaign |
| `referral_partner_path` | Warm Referral Starter Campaign |
| `manual_review_path` | Manual Review Follow-Up |

## Partner Resources database behavior

When the `assignPartnerResources` router action is called, each resource is written to Notion with:

- `partner_id`
- `resource_title`
- `resource_type`
- `partner_type`
- `onboarding_path`
- `priority`
- `status`
- `reason`
- `created_at`
- `updated_at`

## Resource status values

```text
assigned
viewed
completed
archived
```

## Resource priority

Priority is assigned by list order:

1. First resource = highest priority.
2. Later resources = lower priority.
3. Manual review resources should prioritize safe orientation and missing-info guidance.

## Safety rules

Resources must not promise:

- Guaranteed approvals.
- Guaranteed funding.
- Guaranteed partner revenue.
- Credit repair outcomes.
- Automatic commissions.

Use educational, operational, and readiness-based language.

## Sprint 02 boundary

Sprint 02 assigns resource labels and can create Partner Resource records. Sprint 03 renders assigned resources in the dashboard.