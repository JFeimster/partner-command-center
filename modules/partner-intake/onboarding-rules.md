# Onboarding Rules

## Purpose

Define how Sprint 02 assigns an onboarding path after partner classification and tiering.

The onboarding path controls what the welcome/dashboard experience should show later in Sprint 03.

## Supported onboarding paths

```text
broker_fast_start
affiliate_launch_path
referral_partner_path
coi_relationship_path
manual_review_path
```

## Assignment rules

| Rule | Condition | Onboarding path |
|---:|---|---|
| 1 | Tier is `manual_review`, `watchlist`, or `reject` | `manual_review_path` |
| 2 | Partner type is `unknown` | `manual_review_path` |
| 3 | Partner type is `funding_broker` | `broker_fast_start` |
| 4 | Partner type is `affiliate_partner` | `affiliate_launch_path` |
| 5 | Partner type is `center_of_influence` | `coi_relationship_path` |
| 6 | Partner type is `community_connector` | `coi_relationship_path` |
| 7 | Anything else valid | `referral_partner_path` |

## Path definitions

### `broker_fast_start`

Use for partners with existing commercial finance or referral workflow experience.

Dashboard implications:

- Show broker launch checklist.
- Show handoff rules.
- Show partner link setup.
- Show compliance-safe scripts.
- Keep downstream lead tools deferred until Sprint 05.

### `affiliate_launch_path`

Use for creators, publishers, and traffic partners.

Dashboard implications:

- Show campaign assets.
- Show tracking link setup.
- Show compliant CTA copy.
- Show resource links before downstream workflows exist.

### `referral_partner_path`

Use for general referral partners who need a simple warm-intro process.

Dashboard implications:

- Show referral basics.
- Show warm intro scripts.
- Show partner ID and tracking-link education.
- Keep operational complexity low.

### `coi_relationship_path`

Use for CPAs, bookkeepers, attorneys, business brokers, community connectors, and trusted-advisor partners.

Dashboard implications:

- Show relationship-first intro guidance.
- Show COI-specific referral scripts.
- Show educational resources.
- Avoid aggressive sales language.

### `manual_review_path`

Use when fit, risk, or data quality is unclear.

Dashboard implications:

- Show review status.
- Show missing-info prompts.
- Show safe intro resources only.
- Do not show launch-heavy actions until review clears.

## Output shape

```json
{
  "partner_type": "funding_broker",
  "tier": "tier_1",
  "onboarding_path": "broker_fast_start"
}
```

## Sprint 02 boundary

Sprint 02 stores the onboarding path in Notion. It does not yet render live dashboard surfaces. Sprint 03 activates those surfaces.